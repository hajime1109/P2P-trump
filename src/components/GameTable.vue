<script setup>
import { ref, watch } from 'vue'
import { useGameLogic } from './useGameLogic.js'

const props = defineProps({
  myRole: String,
  connections: Array,
  sendMessage: Function,
  sendToPeer: Function,
  messages: Array
})

const { createDeck, shuffle } = useGameLogic()
const myHand = ref([])

watch(props.messages, (newMessages) => {
  const lastMsg = newMessages[newMessages.length - 1]
  if (lastMsg && lastMsg.type === 'DEAL_CARDS') {
    myHand.value = lastMsg.hand
  }
}, { deep: true })

const onDeal = () => {
  const deck = shuffle(createDeck())
  const playerCount = props.connections.length + 1
  const hands = Array.from({ length: playerCount }, () => [])

  deck.forEach((card, index) => {
    hands[index % playerCount].push(card)
  })

  myHand.value = hands[0]

  props.connections.forEach((conn, index) => {
    props.sendToPeer(conn.id, {
      type: 'DEAL_CARDS',
      hand: hands[index + 1]
    })
  })
}

const getCardText = (card) => {
  if (card.suit === 'j') return 'Joker'
  const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' }
  const rankMap = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
  return (suitMap[card.suit] || card.suit) + (rankMap[card.rank] || card.rank)
}
</script>

<template>
  <div class="game-table">
    <p>役割: {{ myRole }} / 参加人数: {{ connections.length + 1 }}</p>
    
    <div v-if="myRole === 'host'">
      <button @click="onDeal">全員にカードを配る</button>
    </div>

    <div class="hand-section">
      <h3>自分の手札 ({{ myHand.length }}枚)</h3>
      <div v-if="myHand.length === 0">配付待ち...</div>
      <div v-else class="cards">
        <span v-for="(card, i) in myHand" :key="i" class="card">
          {{ getCardText(card) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-table { padding: 10px; }
.hand-section { margin-top: 20px; }
.cards { display: flex; flex-wrap: wrap; gap: 5px; }
.card { border: 1px solid #333; padding: 5px; background: white; border-radius: 3px; font-size: 0.9rem; }
</style>