import { defineStore } from 'pinia'
import { ref } from 'vue'
import i18n from '@/i18n'

export const useI18nStore = defineStore('i18n', () => {
  const currentLocale = ref(localStorage.getItem('locale') || 'uz')

  const setLocale = (locale) => {
    currentLocale.value = locale
    i18n.global.locale.value = locale
    localStorage.setItem('locale', locale)
  }

  const toggleLocale = () => {
    const newLocale = currentLocale.value === 'uz' ? 'ru' : 'uz'
    setLocale(newLocale)
  }

  return {
    currentLocale,
    setLocale,
    toggleLocale,
  }
})
