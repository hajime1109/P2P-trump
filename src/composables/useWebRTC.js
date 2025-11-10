// src/composables/useWebRTC.js
// WebRTCの接続ロジック（P2P接続、データチャネル管理）
import { ref } from 'vue'

/**
 * WebRTCのP2P接続を管理するコンポーザブル
 */
export function useWebRTC() {
  const status = ref('切断')
  const messages = ref([])
  const peerConnection = ref(null)
  const dataChannel = ref(null)

  const offerSDP = ref(null)
  const answerSDP = ref(null)

  // 接続状態のイベントリスナー
  const setupConnectionEvents = () => {
    peerConnection.value.onconnectionstatechange = () => {
      status.value = peerConnection.value.connectionState
    }

    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:', event.candidate)
        // オフラインのローカル環境ではSDP交換のみで接続できるため、
        // ICE Candidateの手動交換は省略する
      }
    }
  }

  // データチャネルのイベントリスナー
  const setupDataChannelEvents = () => {
    dataChannel.value.onmessage = (event) => {
      messages.value.push(`受信: ${event.data}`)
    }
    dataChannel.value.onopen = () => console.log('データチャネル開通')
    dataChannel.value.onclose = () => console.log('データチャネル切断')
  }

  // 接続を初期化 (共通)
  const initializeConnection = () => {
    const configuration = { iceServers: [] }
    peerConnection.value = new RTCPeerConnection(configuration)
    setupConnectionEvents()
  }

  // [ホスト用] オファーを作成
  const createOffer = async () => {
    initializeConnection()
    dataChannel.value = peerConnection.value.createDataChannel('chat')
    setupDataChannelEvents()
    
    const offer = await peerConnection.value.createOffer()
    await peerConnection.value.setLocalDescription(offer)
    
    offerSDP.value = JSON.stringify(peerConnection.value.localDescription)
    return offerSDP.value
  }

  // [ゲスト用] アンサーを作成
  const createAnswer = async (receivedOffer) => {
    initializeConnection()
    
    peerConnection.value.ondatachannel = (event) => {
      dataChannel.value = event.channel
      setupDataChannelEvents()
    }

    try {
      const offer = JSON.parse(receivedOffer)
      await peerConnection.value.setRemoteDescription(offer)
      
      const answer = await peerConnection.value.createAnswer()
      await peerConnection.value.setLocalDescription(answer)
      
      answerSDP.value = JSON.stringify(peerConnection.value.localDescription)
      return answerSDP.value
    } catch (e) {
      console.error('オファーの解析または設定に失敗:', e)
      alert('オファーの形式が正しくありません。')
      return null
    }
  }

  // [ホスト用] アンサーを登録
  const receiveAnswer = async (receivedAnswer) => {
    try {
      const answer = JSON.parse(receivedAnswer)
      await peerConnection.value.setRemoteDescription(answer)
    } catch (e) {
      console.error('アンサーの設定に失敗:', e)
      alert('アンサーの形式が正しくありません。')
    }
  }

  // [全員] メッセージ送信
  const sendMessage = (messageInput) => {
    if (dataChannel.value && dataChannel.value.readyState === 'open') {
      dataChannel.value.send(messageInput)
      messages.value.push(`送信: ${messageInput}`)
      return true // 送信成功
    } else {
      alert('接続が確立されていません。')
      return false // 送信失敗
    }
  }

  return {
    status,
    messages,
    offerSDP,
    answerSDP,
    createOffer,
    createAnswer,
    receiveAnswer,
    sendMessage
  }
}