<script setup>
import { ref, watch } from 'vue'
import { useGameLogic } from './useGameLogic.js'

const props = defineProps({
  myRole: String,
  connections: Array,
  sendMessage: Function,
  messages: Array
})

const { createDeck, shuffle } = useGameLogic()
const myHand = ref([])

const onDeal = () => {
  const deck = shuffle(createDeck())
  // 動作確認のため、最初の5枚を自分にセットする
  myHand.value = deck.slice(0, 5)
  // 通信での配布は次のステップで実装する
}
</script>

<template>
  <div class="game-table">
    <p>役割: {{ myRole }}</p>
    
    <div v-if="myRole === 'host'">
      <button @click="onDeal">カードを配る（テスト）</button>
    </div>

    <div class="hand">
      <h3>自分の手札</h3>
      <div v-if="myHand.length === 0">カード未配布</div>
      <div v-else class="card-list">
        <span v-for="(card, i) in myHand" :key="i" class="card-text">
          {{ card.suit }}{{ card.rank }} 
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-table { background: #eef; min-height: 100vh; padding: 10px; }
.card-text { border: 1px solid #000; padding: 2px 5px; margin-right: 5px; background: #fff; }
</style>