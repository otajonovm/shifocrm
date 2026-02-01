import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

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

// PWA Service Worker registration (vite-plugin-pwa handles this automatically)
// This code helps with update notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      console.log('✅ Service Worker ready:', registration.scope)
      
      // Check for updates periodically
      setInterval(async () => {
        await registration.update()
      }, 60 * 60 * 1000) // Check every hour
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('🔄 New version available')
              // You can show a toast notification here instead of confirm
            }
          })
        }
      })
    } catch (error) {
      console.error('❌ Service Worker error:', error)
    }
  })
  
  // Listen for service worker controller changes (app update)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}
