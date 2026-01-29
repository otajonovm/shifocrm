/**
 * Rasmni qayta o'lchamlash va siqish (localStorage uchun).
 * Maksimal 512px, JPEG 0.8.
 */

const MAX_SIZE = 512
const JPEG_QUALITY = 0.82
const MAX_BYTES = 450 * 1024 // ~450KB base64 dan oldin

export function resizeLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Faqat rasm fayllari qabul qilinadi'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      let w = width
      let h = height
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width >= height) {
          w = MAX_SIZE
          h = Math.round((height / width) * MAX_SIZE)
        } else {
          h = MAX_SIZE
          w = Math.round((width / height) * MAX_SIZE)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      let dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      let q = JPEG_QUALITY
      while (q > 0.3 && dataUrl.length > MAX_BYTES) {
        q -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', q)
      }
      resolve(dataUrl)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Rasm yuklanmadi'))
    }
    img.src = url
  })
}
