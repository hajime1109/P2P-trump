<script setup>
defineProps({
  myRole: String,
  connections: Array
})
</script>

<template>
  <div class="game-table">
    <h2>ゲーム画面</h2>
    <p>役割: {{ myRole }}</p>
    <p>対戦相手: {{ connections.length }}人</p>
    <div class="table-area">
      <p>ここはゲーム画面</p>
    </div>
  </div>
</template>

<style scoped>
.game-table { max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; background-color: #2c3e50; color: white; min-height: 100vh; }
.table-area { margin-top: 50px; border: 2px dashed #fff; padding: 50px; }
</style>