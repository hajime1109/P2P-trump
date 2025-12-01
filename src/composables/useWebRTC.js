// src/composables/useWebRTC.js
import { ref } from 'vue'

export function useWebRTC() {
  const connections = ref([]) // 接続リスト { id, pc, dc }
  const messages = ref([])    // チャットログ
  const myRole = ref('')      // 'host' or 'guest'

  let tempHostPC = null       // ホストがAnswer待ちをするための一時変数

  // --- 共通: ICE収集完了を待つ ---
  const waitToCompleteICE = async (pc) => {
    if (pc.iceGatheringState === 'complete') return
    return new Promise(resolve => {
      const check = (e) => { if (!e.candidate) resolve() }
      pc.onicecandidate = check
      // 念のためステータス変更も監視（古いブラウザ等の対策）
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve()
      }
    })
  }

  // --- 共通: チャンネル登録とイベント設定 ---
  const setupChannel = (pc, dc) => {
    const onConnect = () => {
      console.log("接続確立！")
      // 重複登録を防ぐ
      if (!connections.value.find(c => c.dc === dc)) {
        connections.value.push({ pc, dc })
      }
    }

    // ★重要: すでに開いていたら即実行、そうでなければイベントを待つ
    if (dc.readyState === 'open') {
      onConnect()
    } else {
      dc.onopen = onConnect
    }

    // メッセージ受信
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        messages.value.push(data)
        // ホストなら全員に転送（ブロードキャスト）
        if (myRole.value === 'host') {
          broadcast(JSON.stringify(data), dc)
        }
      } catch (err) {
        console.error("受信データの解析に失敗:", err)
      }
    }

    // ★重要: 切断処理
    dc.onclose = () => {
      console.log("切断されました")
      connections.value = connections.value.filter(c => c.dc !== dc)
    }
    
    // エラー処理
    dc.onerror = (err) => console.error("DC Error:", err)
  }

  // --- ホスト: Offer生成 ---
  const hostCreateOffer = async () => {
    myRole.value = 'host'
    const pc = new RTCPeerConnection()
    const dc = pc.createDataChannel("chat")
    
    setupChannel(pc, dc)
    tempHostPC = pc

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitToCompleteICE(pc)

    return JSON.stringify(pc.localDescription)
  }

  // --- ホスト: Answer受信 ---
  const hostReceiveAnswer = async (answerText) => {
    if (!tempHostPC) return alert("接続待ち状態ではありません")
    try {
      const answer = JSON.parse(answerText)
      await tempHostPC.setRemoteDescription(answer)
      tempHostPC = null 
    } catch (e) {
      alert("Answerの読み取りに失敗: " + e.message)
    }
  }

  // --- ゲスト: 参加 ---
  const guestJoin = async (offerText) => {
    myRole.value = 'guest'
    const pc = new RTCPeerConnection()
    
    pc.ondatachannel = (e) => {
      setupChannel(pc, e.channel)
    }

    try {
      const offer = JSON.parse(offerText)
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await waitToCompleteICE(pc)

      return JSON.stringify(pc.localDescription)
    } catch (e) {
      alert("Offerの読み取りに失敗: " + e.message)
      return null
    }
  }

  // --- 送信ロジック ---
  const broadcast = (msgStr, ignoreDC = null) => {
    connections.value.forEach(conn => {
      if (conn.dc !== ignoreDC && conn.dc.readyState === 'open') {
        conn.dc.send(msgStr)
      }
    })
  }

  const sendMessage = (text) => {
    if (!text) return
    const msgObj = { text, sender: myRole.value }
    const msgStr = JSON.stringify(msgObj)

    messages.value.push(msgObj)

    if (myRole.value === 'host') {
      broadcast(msgStr)
    } else {
      connections.value.forEach(conn => {
        if (conn.dc.readyState === 'open') conn.dc.send(msgStr)
      })
    }
  }

  return {
    myRole,
    connections,
    messages,
    hostCreateOffer,
    hostReceiveAnswer,
    guestJoin,
    sendMessage
  }
}