import { useToast } from '@/composables/useToast'

/**
 * Clipboard utility - matnni nusxalash
 */
export const copyToClipboard = async (text, successMessage = 'Nusxalandi!') => {
  const toast = useToast()

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    toast.success(successMessage)
    return true
  } catch (error) {
    console.error('Copy failed:', error)
    toast.error('Nusxalashda xatolik yuz berdi')
    return false
  }
}
