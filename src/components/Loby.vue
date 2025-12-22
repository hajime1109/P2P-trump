<!-- 接続画面 -->
<script setup>
import { ref } from 'vue'
import { useQRLogic } from './useQRLogic.js'

const props = defineProps({
  myRole: String,
  connections: Array,
  messages: Array,
  hostCreateOffer: Function,
  hostReceiveAnswer: Function,
  guestJoin: Function,
  sendMessage: Function
})

const emit = defineEmits(['game-start'])

const {
  qrCodeDataUrl,
  showScanner,
  generateQRCode,
  clearQRCode,
  startScanner,
  stopScanner
} = useQRLogic()

const chatInput = ref('')
const debugText = ref('')

const onHostStart = async () => {
  debugText.value = 'Offer生成中...'
  const offerSDP = await props.hostCreateOffer()
  debugText.value = offerSDP
  await generateQRCode(offerSDP)
}

const onGuestScanOffer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    debugText.value = 'Offer読取完了。Answer生成中...'
    const answerSDP = await props.guestJoin(scannedText)
    if (answerSDP) {
      debugText.value = answerSDP
      await generateQRCode(answerSDP)
    }
  })
}

const onHostScanAnswer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    debugText.value = 'Answer読取完了。接続処理中...'
    await props.hostReceiveAnswer(scannedText)
    clearQRCode()
    debugText.value = '接続完了！'
  })
}

const onSend = () => {
  if (!chatInput.value) return
  props.sendMessage(chatInput.value)
  chatInput.value = ''
}

const startGame = () => {
  emit('game-start')
}
</script>

<template>
  <div class="lobby-container">
    <h2>P2P大富豪 (QR版)</h2>
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
        <p class="debug-text">{{ debugText.slice(0, 50) }}...</p>
      </div>
    </div>

    <div v-if="myRole === 'host' && connections.length > 0" class="start-game-area">
      <hr>
      <button @click="startGame" class="start-btn">ゲームを開始する</button>
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
.lobby-container { max-width: 600px; margin: 0 auto; padding: 10px; font-family: sans-serif; }
.scanner-box { background: #000; color: #fff; padding: 10px; border-radius: 8px; }
.cancel-btn { margin-top: 10px; background: #d32f2f; color: white; border: none; padding: 5px 10px; }
.menu-box { margin-bottom: 20px; }
.qr-display { text-align: center; background: #f9f9f9; padding: 10px; border: 2px solid #333; margin-bottom: 20px; }
.qr-display img { max-width: 100%; height: auto; width: 200px; } 
.debug-text { font-size: 0.8rem; word-break: break-all; color: #ccc; }
.chat-area { border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
.messages { height: 200px; overflow-y: auto; padding: 10px; background: #fff; }
.input-box { display: flex; border-top: 1px solid #ccc; }
.input-box input { flex: 1; padding: 10px; border: none; outline: none; }
.input-box button { padding: 0 20px; border: none; background: #2196f3; color: white; cursor: pointer; }
button { padding: 10px; margin: 5px 0; cursor: pointer; }
.start-game-area { text-align: center; margin: 20px 0; }
.start-btn { background-color: #4CAF50; color: white; font-weight: bold; font-size: 1.2rem; width: 100%; }
</style>