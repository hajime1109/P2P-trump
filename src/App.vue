<script setup>
import { ref, watch } from 'vue'
import { useWebRTC } from './components/useWebRTC.js'
import Lobby from './components/Lobby.vue'
import GameTable from './components/GameTable.vue'

const {
  myRole,
  connections,
  messages,
  hostCreateOffer,
  hostReceiveAnswer,
  guestJoin,
  sendMessage,
  sendToPeer
} = useWebRTC()

const isGameStarted = ref(false)

watch(messages, (newMessages) => {
  const lastMsg = newMessages[newMessages.length - 1]
  if (lastMsg && lastMsg.type === 'SYSTEM_GAME_START') {
    isGameStarted.value = true
  }
}, { deep: true })

const handleGameStart = () => {
  sendMessage({ type: 'SYSTEM_GAME_START' })
  isGameStarted.value = true
}
</script>

<template>
  <div>
    <Lobby
      v-if="!isGameStarted"
      :my-role="myRole"
      :connections="connections"
      :messages="messages"
      :host-create-offer="hostCreateOffer"
      :host-receive-answer="hostReceiveAnswer"
      :guest-join="guestJoin"
      :send-message="sendMessage"
      @game-start="handleGameStart"
    />
    <GameTable
      v-else
      :my-role="myRole"
      :connections="connections"
      :sendMessage="sendMessage"
      :sendToPeer="sendToPeer"
      :messages="messages"
    />
  </div>
</template>

<style>
body { margin: 0; padding: 0; font-family: sans-serif; }
</style>