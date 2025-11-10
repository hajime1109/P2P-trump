<script setup>
import { ref } from 'vue'
import { useWebRTC } from './composables/useWebRTC.js'
import { useQRCode } from './composables/useQRCode.js'

const {
  status,
  messages,
  createOffer,
  createAnswer,
  receiveAnswer,
  sendMessage
} = useWebRTC()

const {
  qrCodeDataUrl,
  showScanner,
  generateQRCode,
  clearQRCode,
  startScanner,
  stopScanner
} = useQRCode()

const messageInput = ref('')

const handleCreateOffer = async () => {
  const offer = await createOffer()
  if (offer) {
    await generateQRCode(offer)
  }
}

const handleScanOffer = () => {
  clearQRCode()
  startScanner(async (decodedOffer) => {
    const answer = await createAnswer(decodedOffer)
    if (answer) {
      await generateQRCode(answer)
    }
  })
}

const handleScanAnswer = () => {
  clearQRCode()
  startScanner(async (decodedAnswer) => {
    await receiveAnswer(decodedAnswer)
  })
}

const handleSendMessage = () => {
  if (sendMessage(messageInput.value)) {
    messageInput.value = ''
  }
}
</script>

<template>
  <div>
    <h1>P2P大富豪</h1>
    <p><strong>接続状態:</strong> {{ status }}</p>

    <div v-if="showScanner">
      <div id="qr-reader" style="width: 300px"></div>
      <button @click="stopScanner">スキャンをキャンセル</button>
    </div>

    <div v-if="!showScanner">
      <div>
        <h3>ホスト用</h3>
        <button @click="handleCreateOffer">1. 部屋を作成 (オファーQR生成)</button>
        <button 
          @click="handleScanAnswer" 
          :disabled="status === 'connected'">
          3. ゲストのアンサーQRをスキャン
        </button>
      </div>

      <hr>

      <div>
        <h3>プレイヤー用</h3>
        <button @click="handleScanOffer">2. ホストのオファーQRをスキャン</button>
      </div>

      <div v-if="qrCodeDataUrl">
        <p>相手にこのQRをスキャンさせてください:</p>
        <img :src="qrCodeDataUrl" alt="接続用QRコード" />
      </div>
    </div>

    <div v-if="status === 'connected'">
      <hr>
      <h3>チャット</h3>
      <div>
        <div v-for="(msg, index) in messages" :key="index">{{ msg }}</div>
      </div>
      <form @submit.prevent="handleSendMessage">
        <input type="text" v-model="messageInput" placeholder="メッセージを入力" />
        <button type="submit">送信</button>
      </form>
    </div>

  </div>
</template>
