import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

// Toast konfiguratsiyasi
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
