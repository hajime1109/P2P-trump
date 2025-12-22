<script setup>
import { ref } from 'vue'
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
  sendMessage
} = useWebRTC()

const isGameStarted = ref(false)

const handleGameStart = () => {
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
    />
  </div>
</template>

<style>
body { margin: 0; padding: 0; font-family: sans-serif; }
</style>