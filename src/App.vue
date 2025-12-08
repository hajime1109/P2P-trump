<script setup>
import { ref } from 'vue'
import { useWebRTC } from './composables/useWebRTC.js'
import { useQRLogic } from './composables/useQRLogic.js'

// 通信ロジック
const {
  myRole,
  connections,
  messages,
  hostCreateOffer,
  hostReceiveAnswer,
  guestJoin,
  sendMessage
} = useWebRTC()

// QRロジック
const {
  qrCodeDataUrl,
  showScanner,
  generateQRCode,
  clearQRCode,
  startScanner,
  stopScanner
} = useQRLogic()

const chatInput = ref('')
const debugText = ref('') // デバッグ用（読み取った内容などを表示）

// --- 1. ホスト: 部屋作成 (Offer QR表示) ---
const onHostStart = async () => {
  debugText.value = 'Offer生成中...'
  const offerSDP = await hostCreateOffer()
  debugText.value = offerSDP
  await generateQRCode(offerSDP)
}

// --- 2. ゲスト: 参加 (Offer QRスキャン -> Answer QR表示) ---
const onGuestScanOffer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    debugText.value = 'Offer読取完了。Answer生成中...'
    const answerSDP = await guestJoin(scannedText)
    if (answerSDP) {
      debugText.value = answerSDP
      await generateQRCode(answerSDP)
    }
  })
}

// --- 3. ホスト: 接続完了 (Answer QRスキャン) ---
const onHostScanAnswer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    debugText.value = 'Answer読取完了。接続処理中...'
    await hostReceiveAnswer(scannedText)
    clearQRCode() // QRを消す
    debugText.value = '接続完了！'
  })
}

// チャット送信
const onSend = () => {
  sendMessage(chatInput.value)
  chatInput.value = ''
}
</script>

<template>
  <div class="container">
    <h2>P2P大富豪</h2>
    <p>役割: {{ myRole || '未定' }} / 接続数: {{ connections.length }}</p>

    <div v-if="showScanner" class="scanner-box">
      <p>カメラでQRコードを読み取ってください</p>
      <div id="qr-reader" style="width: 100%;"></div>
      <button @click="stopScanner" class="cancel-btn">キャンセル</button>
    </div>

    <div v-else>
      <div v-if="connections.length === 0 || myRole === 'host'" class="menu-box">
        
        <div v-if="!myRole || myRole === 'host'">
          <h3>ホストとして始める</h3>
          <button @click="onHostStart" :disabled="!!qrCodeDataUrl">1. 部屋を作る (QR生成)</button>
          
          <div v-if="qrCodeDataUrl && myRole === 'host'" style="margin-top:10px;">
            <button @click="onHostScanAnswer">3. ゲストのQRを読み取る</button>
          </div>
        </div>

        <hr v-if="!myRole">

        <div v-if="!myRole || myRole === 'guest'">
          <h3>ゲストとして参加</h3>
          <button @click="onGuestScanOffer" :disabled="!!qrCodeDataUrl">2. ホストのQRを読み取る</button>
        </div>

      </div>

      <div v-if="qrCodeDataUrl" class="qr-display">
        <p style="color:red; font-weight:bold;">相手にこのQRを読み取らせてください</p>
        <img :src="qrCodeDataUrl" alt="QR Code" />
        <p style="font-size:0.8rem; word-break: break-all; color:#ccc;">{{ debugText.slice(0, 50) }}...</p>
      </div>
    </div>

    <hr>

    <div class="chat-area">
      <div class="messages">
        <div v-for="(m, i) in messages" :key="i">
          <strong>[{{ m.sender }}]</strong> {{ m.text }}
        </div>
      </div>
      <div class="input-box">
        <input v-model="chatInput" type="text" placeholder="メッセージ..." @keydown.enter="onSend">
        <button @click="onSend">送信</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 0 auto; padding: 10px; font-family: sans-serif; }
.scanner-box { background: #000; color: #fff; padding: 10px; border-radius: 8px; }
.cancel-btn { margin-top: 10px; background: #d32f2f; color: white; border: none; padding: 5px 10px; }
.menu-box { margin-bottom: 20px; }
.qr-display { text-align: center; background: #f9f9f9; padding: 10px; border: 2px solid #333; margin-bottom: 20px; }
.qr-display img { width: 200px; height: auto; }
.chat-area { border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
.messages { height: 200px; overflow-y: auto; padding: 10px; background: #fff; }
.input-box { display: flex; border-top: 1px solid #ccc; }
.input-box input { flex: 1; padding: 10px; border: none; outline: none; }
.input-box button { padding: 0 20px; border: none; background: #2196f3; color: white; cursor: pointer; }
button { padding: 10px; margin: 5px 0; cursor: pointer; }
</style>