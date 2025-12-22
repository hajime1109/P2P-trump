// src/composables/useQRLogic.js
import { ref, onBeforeUnmount } from 'vue'
import QRCode from 'qrcode'
import { Html5QrcodeScanner } from 'html5-qrcode'

export function useQRLogic() {
  const qrCodeDataUrl = ref('') // 生成したQRコード画像
  const scanner = ref(null)
  const showScanner = ref(false)

  // QRコードを生成する
  const generateQRCode = async (text) => {
    try {
      qrCodeDataUrl.value = await QRCode.toDataURL(text)
    } catch (err) {
      console.error('QRコードの生成に失敗:', err)
      qrCodeDataUrl.value = ''
    }
  }

  // QRコードをクリアする
  const clearQRCode = () => {
    qrCodeDataUrl.value = ''
  }

  // スキャナーを停止する
  const stopScanner = () => {
    if (scanner.value) {
      scanner.value.clear().catch(error => {
        console.error('スキャナーの停止に失敗:', error)
      })
      scanner.value = null
    }
    showScanner.value = false
  }

  // スキャナーを開始する
  const startScanner = (onScanSuccess) => {
    showScanner.value = true
    setTimeout(() => {
      // id="qr-reader" の要素にスキャナを表示
      scanner.value = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      
      const successCallback = (decodedText) => {
        stopScanner() // 成功したら自動で閉じる
        onScanSuccess(decodedText)
      }
      
      scanner.value.render(successCallback, (error) => { /* 失敗時は無視 */ })
    }, 100)
  }

  onBeforeUnmount(stopScanner)

  return {
    qrCodeDataUrl,
    showScanner,
    generateQRCode,
    clearQRCode,
    startScanner,
    stopScanner
  }
}