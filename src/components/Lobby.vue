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
const manualInput = ref('')
const showManual = ref(false)

const onHostStart = async () => {
  const offerSDP = await props.hostCreateOffer()
  debugText.value = offerSDP
  await generateQRCode(offerSDP)
}

const onGuestScanOffer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    const answerSDP = await props.guestJoin(scannedText)
    if (answerSDP) debugText.value = answerSDP
  })
}

const onHostScanAnswer = () => {
  clearQRCode()
  startScanner(async (scannedText) => {
    await props.hostReceiveAnswer(scannedText)
  })
}

const onManualJoin = async () => {
  const answerSDP = await props.guestJoin(manualInput.value)
  if (answerSDP) debugText.value = answerSDP
}

const onManualReceiveAnswer = async () => {
  await props.hostReceiveAnswer(manualInput.value)
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
  <div class="lobby">
    <h2>ロビー</h2>
    <p>役割: {{ myRole || '未定' }} / 接続: {{ connections.length }}</p>

    <div v-if="showScanner">
      <div id="qr-reader"></div>
      <button @click="stopScanner">キャンセル</button>
    </div>

    <div v-else>
      <div v-if="!myRole || myRole === 'host'">
        <button @click="onHostStart">1. 部屋を作る</button>
      </div>
      <div v-if="!myRole || myRole === 'guest'">
        <button @click="onGuestScanOffer">2. QR読取参加</button>
      </div>

      <button @click="showManual = !showManual">手動接続設定</button>
      <div v-if="showManual">
        <textarea readonly :value="debugText" placeholder="自分のSDP"></textarea>
        <textarea v-model="manualInput" placeholder="相手のSDPを貼付"></textarea>
        <button @click="onManualJoin" v-if="!myRole || myRole === 'guest'">Join</button>
        <button @click="onManualReceiveAnswer" v-if="myRole === 'host'">Answer承認</button>
      </div>

      <div v-if="qrCodeDataUrl">
        <img :src="qrCodeDataUrl" style="width: 200px" />
        <button @click="onHostScanAnswer" v-if="myRole === 'host'">3. ゲストQR読取</button>
      </div>
    </div>

    <button v-if="myRole === 'host' && connections.length > 0" @click="startGame">ゲーム開始</button>

    <div class="chat">
      <div v-for="(m, i) in messages" :key="i">
        <span v-if="m.type === 'chat'">[{{ m.sender }}] {{ m.text }}</span>
      </div>
      <input v-model="chatInput" @keydown.enter="onSend" placeholder="チャット">
    </div>
  </div>
</template>

<style scoped>
.lobby { padding: 10px; }
textarea { width: 100%; height: 60px; font-size: 10px; }
.chat { border: 1px solid #ccc; margin-top: 10px; height: 100px; overflow-y: auto; }
</style>