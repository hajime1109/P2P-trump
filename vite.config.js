// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import basicSzl from '@vitejs/plugin-basic-ssl' // 追加

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    basicSzl() // 追加
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: "0.0.0.0",
  }
})