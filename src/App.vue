<script setup>
import { ref, onMounted } from 'vue'
import QRCodeVue from 'qrcode.vue'
import { Html5QrcodeScanner } from 'html5-qrcode'

// --- 状態管理 ---
const status = ref('切断') // 接続状態
const messages = ref([]) // メッセージログ
const messageInput = ref('') // 入力中のメッセージ

// WebRTC関連
const peerConnection = ref(null)
const dataChannel = ref(null)

/**
 * WebRTCの接続を初期化
 */
const initializeConnection = () => {
  // STUNサーバーはオフラインでは不要だが、ローカルIP取得のために空でも設定
  const configuration = { iceServers: [] }
  peerConnection.value = new RTCPeerConnection(configuration)

  // 接続状態の監視
  peerConnection.value.onconnectionstatechange = () => {
    status.value = peerConnection.value.connectionState
  }

  // (ホスト用) ICE Candidate（接続経路情報）が見つかった時の処理
  // これも手動で交換する必要がある
  peerConnection.value.onicecandidate = (event) => {
    if (event.candidate) {
      // 実際にはこれもコピペで交換する必要があるが、
      // 多くのローカル環境ではSDP交換だけで接続できるため、
      // 最小限のデモとしてここは一旦簡略化する。
      console.log('ICE Candidate:', event.candidate)
    }
  }

  // (ゲスト用) データチャネルが作られた時の処理
  peerConnection.value.ondatachannel = (event) => {
    dataChannel.value = event.channel
    setupDataChannelEvents()
  }
}

/**
 * データチャネルのイベント（メッセージ受信）を設定
 */
const setupDataChannelEvents = () => {
  dataChannel.value.onmessage = (event) => {
    messages.value.push(`受信: ${event.data}`)
  }
  dataChannel.value.onopen = () => {
    console.log('データチャネル開通')
  }
  dataChannel.value.onclose = () => {
    console.log('データチャネル切断')
  }
}

/**
 * [ホスト用] 1. オファーを作成する
 */
const createOffer = async () => {
  initializeConnection()

  // (ホスト用) データチャネルを作成
  dataChannel.value = peerConnection.value.createDataChannel('chat')
  setupDataChannelEvents()

  // オファー（SDP）を作成
  const offer = await peerConnection.value.createOffer()
  await peerConnection.value.setLocalDescription(offer)

  // 画面のテキストエリアに表示（これをゲストにコピペで渡す）
  offerSDP.value = JSON.stringify(peerConnection.value.localDescription)
}

/**
 * [ゲスト用] 2. オファーを受け取り、アンサーを作成する
 */
const createAnswer = async () => {
  initializeConnection()

  try {
    const offer = JSON.parse(offerSDP.value)
    await peerConnection.value.setRemoteDescription(offer)

    const answer = await peerConnection.value.createAnswer()
    await peerConnection.value.setLocalDescription(answer)

    // 画面のテキストエリアに表示（これをホストにコピペで渡す）
    answerSDP.value = JSON.stringify(peerConnection.value.localDescription)
  } catch (e) {
    console.error('オファーの解析または設定に失敗:', e)
    alert('オファーの形式が正しくありません。')
  }
}

/**
 * [ホスト用] 3. アンサーを受け取る
 */
const receiveAnswer = async () => {
  try {
    const answer = JSON.parse(answerSDP.value)
    await peerConnection.value.setRemoteDescription(answer)
  } catch (e) {
    console.error('アンサーの設定に失敗:', e)
    alert('アンサーの形式が正しくありません。')
  }
}

/**
 * [全員] メッセージを送信する
 */
const sendMessage = () => {
  if (dataChannel.value && dataChannel.value.readyState === 'open') {
    const msg = messageInput.value
    dataChannel.value.send(msg)
    messages.value.push(`送信: ${msg}`)
    messageInput.value = ''
  } else {
    alert('接続が確立されていません。')
  }
}
</script>

<template>
  <div class="container">
    <h1>P2P大富豪</h1>
    <p><strong>接続状態:</strong> {{ status }}</p>

<!-- ホストの画面 -->
    <div class="manual-signaling">
      <div class="step-box">
        <h3>ホスト用</h3>
        <p>
          <button @click="createOffer">部屋を作成</button>
        </p>
        <textarea v-model="offerSDP" readonly
          placeholder="コードをコピーしてプレイヤーにペースト">
        </textarea>

        <p>プレイヤーのコードをコピー</p>
        <p>
        <textarea v-model="answerSDP" placeholder="プレイヤーのコードをペースト"></textarea>
        </p>
        <button @click="receiveAnswer">コードを登録</button>
      </div>

      <!-- プレイヤーの画面 -->
       <hr>
      <div class="step-box">
        <h3>プレイヤー用</h3>
        <p>ホストのコードをコピー</p>
        <p>
          <textarea v-model="offerSDP" placeholder="ホストのコードをペースト"></textarea>
        </p>
        <button @click="createAnswer">アンサーを作成</button>
        <p>
        <textarea v-model="answerSDP" readonly
          placeholder="コードをコピーしてプレイヤーにペースト">
        </textarea>
        </p>
      </div>
    </div>

    <div class="chat-box" v-if="status === 'connected'">
      <h3>チャット</h3>
      <div class="messages">
        <div v-for="(msg, index) in messages" :key="index">{{ msg }}</div>
      </div>
      <form @submit.prevent="sendMessage">
        <input type="text" v-model="messageInput" placeholder="メッセージを入力" />
        <button type="submit">送信</button>
      </form>
    </div>

  </div>
</template>

