import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import ru from './locales/ru.json'

// localStorage'dan saqlangan tilni olish
const savedLocale = localStorage.getItem('locale') || 'uz'

const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: savedLocale, // default til
  fallbackLocale: 'uz', // fallback til
  messages: {
    uz,
    ru,
  },
  // Global scope'da $t ishlatish uchun
  globalInjection: true,
})

export default i18n
