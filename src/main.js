import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/main.css'
import './assets/mobile.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

const toastOptions = {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(Toast, toastOptions)

app.mount('#app')

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length) {
          await Promise.all(registrations.map(registration => registration.unregister()))
          console.info('🧹 Service workers unregistered in development mode')
          window.location.reload()
        }
      } catch (error) {
        console.warn('Service worker cleanup failed:', error)
      }
    })
  } else {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.ready

        setInterval(async () => {
          await registration.update()
        }, 60 * 60 * 1000)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New version available')
              }
            })
          }
        })
      } catch (error) {
        console.error('❌ Service Worker error:', error)
      }
    })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }
}
