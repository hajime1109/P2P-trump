import { ref, onBeforeUnmount } from 'vue'
import QRCode from 'qrcode'
import { Html5QrcodeScanner } from 'html5-qrcode'


export function useQRLogic() {
  const qrCodeDataUrl = ref('') 
  const scanner = ref(null)
  const showScanner = ref(false)

  const generateQRCode = async (text) => {
    try {
      qrCodeDataUrl.value = await QRCode.toDataURL(text)
    } catch (err) {
      console.error('QRコードの生成に失敗:', err)
      qrCodeDataUrl.value = ''
    }
  }

  const clearQRCode = () => {
    qrCodeDataUrl.value = ''
  }

  const stopScanner = () => {
    if (scanner.value) {
      scanner.value.clear().catch(error => {
        console.error('スキャナーの停止に失敗:', error)
      })
      scanner.value = null
    }
    showScanner.value = false
  }

  const startScanner = (onScanSuccess) => {
    showScanner.value = true
    setTimeout(() => {
      scanner.value = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      
      const successCallback = (decodedText) => {
        stopScanner() 
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
