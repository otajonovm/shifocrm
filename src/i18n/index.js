import { createI18n } from 'vue-i18n'
import uz from './uz.json'
import ru from './ru.json'

const savedLocale = localStorage.getItem('locale')
const defaultLocale = savedLocale || 'uz'

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'uz',
  messages: {
    uz,
    ru
  }
})

export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

export default i18n
