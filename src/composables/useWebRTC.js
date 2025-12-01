// src/composables/useWebRTC.js
import { ref } from 'vue'

export function useWebRTC() {
  const connections = ref([]) // 接続リスト
  const messages = ref([])    // チャットログ
  const myRole = ref('')      // 'host' or 'guest'

  // ホストがAnswer待ちをするための一次変数
  let tempHostPC = null

  // --- 共通: ICE Candidate（接続経路情報）が揃うのを待つ関数 ---
  // これがないとコピペしてもつながらない
  const waitToCompleteICE = async (pc) => {
    if (pc.iceGatheringState === 'complete') return
    return new Promise(resolve => {
      pc.onicecandidate = (e) => { if (!e.candidate) resolve() }
    })
  }

  // --- ホスト: 1. 部屋を作る (Offer生成) ---
  const hostCreateOffer = async () => {
    myRole.value = 'host'
    const pc = new RTCPeerConnection()
    const dc = pc.createDataChannel("chat") // ホストがデータチャネル作成
    
    // チャンネルのセットアップ
    setupChannel(pc, dc)
    
    // 接続待ちとして保持
    tempHostPC = pc

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitToCompleteICE(pc)

    return JSON.stringify(pc.localDescription)
  }

  // --- ホスト: 3. ゲストのAnswerを受け取る ---
  const hostReceiveAnswer = async (answerText) => {
    if (!tempHostPC) return
    const answer = JSON.parse(answerText)
    await tempHostPC.setRemoteDescription(answer)
    // 接続完了。リストへの追加は setupChannel 内の onopen で行われる
    tempHostPC = null 
  }

  // --- ゲスト: 2. 参加する (Offer受取 -> Answer生成) ---
  const guestJoin = async (offerText) => {
    myRole.value = 'guest'
    const pc = new RTCPeerConnection()
    
    // ゲストはホストからチャンネルを受け取る
    pc.ondatachannel = (e) => {
      setupChannel(pc, e.channel)
    }

    const offer = JSON.parse(offerText)
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await waitToCompleteICE(pc)

    return JSON.stringify(pc.localDescription)
  }

  // --- 共通: チャンネルのイベント設定とリスト管理 ---
  const setupChannel = (pc, dc) => {
    dc.onopen = () => {
      console.log("接続しました")
      connections.value.push({ pc, dc }) // ここで初めてリストに追加
    }
    
    dc.onmessage = (e) => {
      const data = JSON.parse(e.data)
      messages.value.push(data)
      
      // ホストなら、他の人にも転送（ブロードキャスト）
      if (myRole.value === 'host') {
        broadcast(JSON.stringify(data), dc)
      }
    }
  }

  // --- ホスト用: 送信元以外全員に転送 ---
  const broadcast = (msgStr, ignoreDC = null) => {
    connections.value.forEach(conn => {
      if (conn.dc !== ignoreDC && conn.dc.readyState === 'open') {
        conn.dc.send(msgStr)
      }
    })
  }

  // --- 共通: メッセージ送信 ---
  const sendMessage = (text) => {
    const msgObj = { text, sender: myRole.value }
    const msgStr = JSON.stringify(msgObj)

    // 自分の画面に追加
    messages.value.push(msgObj)

    if (myRole.value === 'host') {
      broadcast(msgStr) // ホストは全員に配る
    } else {
      // ゲストはホスト(リストの0番目)に送る
      connections.value.forEach(conn => conn.dc.send(msgStr))
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