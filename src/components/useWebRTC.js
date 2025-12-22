// src/composables/useWebRTC.js
import { ref } from 'vue'

export function useWebRTC() {
  const connections = ref([]) // 接続リスト
  const messages = ref([])    // チャットログ
  const myRole = ref('')      // 'host' or 'guest'

  // ホストがAnswer待ちをするための一次変数
  let tempHostPC = null

  // --- 共通: ICE Candidateの収集を確実に待つ関数 ---
  const setupIceHandling = (pc, label) => {
    return new Promise(resolve => {
      // すでに完了していれば即終了
      if (pc.iceGatheringState === 'complete') {
        console.log(`[${label}] ICE収集はすでに完了済み`)
        resolve()
        return
      }
      
      const check = () => {
        if (pc.iceGatheringState === 'complete') {
          console.log(`[${label}] ICE収集完了！`)
          pc.removeEventListener('icegatheringstatechange', check)
          resolve()
        }
      }
      pc.addEventListener('icegatheringstatechange', check)
      
      // 念のため onicecandidate でも監視（nullが来たら完了）
      pc.onicecandidate = (e) => {
        if (!e.candidate) check() 
      }
    })
  }

  // --- 共通: チャンネル設定（重要修正：すれ違い防止） ---
  const setupChannel = (pc, dc) => {
    const onConnect = () => {
      console.log("★データチャネルが開通したのだ！")
      // 重複登録を防ぎつつリストに追加
      if (!connections.value.find(c => c.dc === dc)) {
        connections.value.push({ pc, dc })
      }
    }

    // ★ここが修正点: すでに開いていたら即実行する
    if (dc.readyState === 'open') {
      console.log("チャネルは既に開いています。即時接続します。")
      onConnect()
    } else {
      dc.onopen = onConnect
    }
    
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        messages.value.push(data)
        // ホストなら全員に転送
        if (myRole.value === 'host') {
          broadcast(JSON.stringify(data), dc)
        }
      } catch (err) {
        console.error("受信データ解析エラー:", err)
      }
    }

    // 切断処理
    dc.onclose = () => {
      console.log("切断されました")
      connections.value = connections.value.filter(c => c.dc !== dc)
    }
  }

  // --- ホスト: 1. Offer生成 ---
  const hostCreateOffer = async () => {
    console.log("Host: 処理開始")
    myRole.value = 'host'
    const pc = new RTCPeerConnection()
    
    // 監視準備
    const icePromise = setupIceHandling(pc, "Host")

    const dc = pc.createDataChannel("chat")
    setupChannel(pc, dc)
    tempHostPC = pc

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    console.log("Host: ICE収集中...")
    await icePromise // 完了待ち

    return JSON.stringify(pc.localDescription)
  }

  // --- ホスト: 3. Answer受信 ---
  const hostReceiveAnswer = async (answerText) => {
    console.log("Host: Answer受信")
    if (!tempHostPC) return alert("接続待ち状態ではありません")
    try {
      const answer = JSON.parse(answerText)
      await tempHostPC.setRemoteDescription(answer)
      console.log("Host: RemoteDescription設定完了。開通を待ちます。")
      tempHostPC = null 
    } catch (e) {
      alert("エラー: " + e.message)
    }
  }

  // --- ゲスト: 2. 参加 ---
  const guestJoin = async (offerText) => {
    console.log("Guest: 処理開始")
    myRole.value = 'guest'
    const pc = new RTCPeerConnection()
    
    // 監視準備
    const icePromise = setupIceHandling(pc, "Guest")

    pc.ondatachannel = (e) => {
      console.log("Guest: チャンネルを受信しました")
      setupChannel(pc, e.channel)
    }

    try {
      const offer = JSON.parse(offerText)
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      console.log("Guest: ICE収集中...")
      await icePromise // 完了待ち

      return JSON.stringify(pc.localDescription)
    } catch (e) {
      alert("エラー: " + e.message)
      return ""
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