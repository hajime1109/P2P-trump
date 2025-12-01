<script setup>
import { ref } from 'vue'
import { useWebRTC } from './composables/useWebRTC.js'

const {
  myRole,
  connections,
  messages,
  hostCreateOffer,
  hostReceiveAnswer,
  guestJoin,
  sendMessage
} = useWebRTC()

const sdpInput = ref('')
const sdpOutput = ref('')
const chatInput = ref('')

// ホスト: Offer生成
const onHostStart = async () => {
  sdpOutput.value = await hostCreateOffer()
}

// ホスト: Answer受信
const onHostConnect = async () => {
  await hostReceiveAnswer(sdpInput.value)
  sdpInput.value = ''
}

// ゲスト: 参加 (Offer入力 -> Answer出力)
const onGuestJoin = async () => {
  sdpOutput.value = await guestJoin(sdpInput.value)
  sdpInput.value = ''
}

const onSend = () => {
  sendMessage(chatInput.value)
  chatInput.value = ''
}
</script>

<template>
  <div style="padding: 20px;">
    <h2>P2P最小テスト</h2>
    <p>現在の役割: {{ myRole }} / 接続数: {{ connections.length }}</p>

    <hr>
    
    <div v-if="connections.length === 0 || myRole === 'host'">
      <h3>1. シグナリング (SDP交換)</h3>
      <div style="margin-bottom: 10px;">
        <button @click="onHostStart">【ホスト】部屋を作る(Offer生成)</button>
        <button @click="onGuestJoin">【ゲスト】参加する(Answer生成)</button>
        <button @click="onHostConnect">【ホスト】接続完了(Answer入力)</button>
      </div>

      <p>コピー用(出力):</p>
      <textarea v-model="sdpOutput" readonly style="width:100%; height:50px;"></textarea>

      <p>貼り付け用(入力):</p>
      <textarea v-model="sdpInput" style="width:100%; height:50px;"></textarea>
    </div>

    <hr>

    <h3>2. チャット</h3>
    <div style="border:1px solid #ccc; height:200px; overflow-y:scroll; margin-bottom:10px;">
      <div v-for="(m, i) in messages" :key="i">
        [{{ m.sender }}] {{ m.text }}
      </div>
    </div>
    <input v-model="chatInput" type="text">
    <button @click="onSend">送信</button>
  </div>
</template>