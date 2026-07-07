<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-10">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 bg-gradient-to-r from-primary-500 to-primary-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('signUp.title') }}</h1>
        <p class="text-gray-500 mt-2 text-sm">{{ t('signUp.subtitle') }}</p>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <!-- Muvaffaqiyat holati -->
        <div v-if="done" class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900">{{ t('signUp.successTitle') }}</h2>
          <p class="text-sm text-gray-500">{{ t('signUp.successCheckEmail') }}</p>
          <router-link
            to="/login"
            class="inline-block w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
          >
            {{ t('signUp.goLogin') }}
          </router-link>
        </div>

        <!-- Forma -->
        <form v-else @submit.prevent="handleSignUp" class="space-y-5">
          <div>
            <label for="su-name" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('signUp.fullNameLabel') }}
            </label>
            <input
              id="su-name"
              v-model="fullName"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              :placeholder="t('signUp.fullNamePlaceholder')"
            />
          </div>

          <div>
            <label for="su-email" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('signUp.emailLabel') }}
            </label>
            <input
              id="su-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              :placeholder="t('signUp.emailPlaceholder')"
            />
          </div>

          <div>
            <label for="su-phone" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('signUp.phoneLabel') }} *
            </label>
            <input
              id="su-phone"
              :value="phone"
              type="tel"
              required
              autocomplete="tel"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              :placeholder="UZ_PHONE_PLACEHOLDER"
              @input="onPhoneInput"
              @focus="ensurePhonePrefix"
            />
          </div>

          <div>
            <label for="su-password" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('signUp.passwordLabel') }}
            </label>
            <input
              id="su-password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              :placeholder="t('signUp.passwordPlaceholder')"
            />
          </div>

          <div>
            <label for="su-password2" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('signUp.passwordConfirmLabel') }}
            </label>
            <input
              id="su-password2"
              v-model="passwordConfirm"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              :placeholder="t('signUp.passwordPlaceholder')"
            />
          </div>

          <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ errorMsg }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-500/25"
          >
            <span v-if="isLoading">{{ t('signUp.loading') }}</span>
            <span v-else>{{ t('signUp.submit') }}</span>
          </button>
        </form>

        <p v-if="!done" class="text-center text-sm text-gray-500 mt-6">
          {{ t('signUp.haveAccount') }}
          <router-link to="/login" class="text-primary-600 font-medium hover:underline">
            {{ t('signUp.signInLink') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { registerIndividualSoloDoctor } from '@/services/authService'
import { UZ_PHONE_PLACEHOLDER, formatPhoneUzDisplay, formatPhoneForStorage } from '@/lib/phoneUz'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const passwordConfirm = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const done = ref(false)

const onPhoneInput = (event) => {
  const formatted = formatPhoneUzDisplay(event.target.value)
  phone.value = formatted
  event.target.value = formatted
}

const ensurePhonePrefix = () => {
  if (!phone.value) phone.value = '+998'
}

const validate = () => {
  if (!fullName.value.trim() || !email.value.trim() || !password.value) {
    return t('signUp.errorRequired')
  }
  const normalizedPhone = formatPhoneForStorage(phone.value) || phone.value.trim()
  if (!normalizedPhone || normalizedPhone.replace(/\D/g, '').length < 12) {
    return t('signUp.errorPhoneRequired')
  }
  if (password.value.length < 6) {
    return t('signUp.errorPasswordShort')
  }
  if (password.value !== passwordConfirm.value) {
    return t('signUp.errorPasswordMismatch')
  }
  return ''
}

const handleSignUp = async () => {
  errorMsg.value = ''
  const validationError = validate()
  if (validationError) {
    errorMsg.value = validationError
    return
  }

  const normalizedPhone = formatPhoneForStorage(phone.value) || phone.value.trim()

  isLoading.value = true
  const { error } = await registerIndividualSoloDoctor({
    email: email.value,
    password: password.value,
    fullName: fullName.value,
    phone: normalizedPhone,
  })
  isLoading.value = false

  if (error) {
    errorMsg.value = error.message
    return
  }

  // Shifokor tabidagi telefon + parol bilan darhol kirish
  const loggedIn = await authStore.loginDoctor({
    phone: normalizedPhone,
    password: password.value,
  })

  if (loggedIn) {
    toast.success(t('auth.loginSuccess'))
    router.push('/dashboard')
    return
  }

  done.value = true
}
</script>
