import { useToast as useVueToast } from 'vue-toastification'

export function useToast() {
  const toast = useVueToast()

  return {
    // Muvaffaqiyatli xabar
    success: (message) => {
      toast.success(message)
    },

    // Xatolik xabari
    error: (message) => {
      toast.error(message)
    },

    // Ogohlantirish xabari
    warning: (message) => {
      toast.warning(message)
    },

    // Ma'lumot xabari
    info: (message) => {
      toast.info(message)
    },

    // Oddiy xabar
    default: (message) => {
      toast(message)
    }
  }
}
