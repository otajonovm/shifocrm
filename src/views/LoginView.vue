<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
    <div class="max-w-md w-full">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">ShifoCRM</h1>
        <p class="text-gray-500 mt-2">Tibbiyot markazingiz uchun boshqaruv tizimi</p>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <!-- Login Type Tabs -->
        <div class="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            @click="loginType = 'admin'"
            :class="[
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              loginType === 'admin'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </span>
          </button>
          <button
            @click="loginType = 'doctor'"
            :class="[
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              loginType === 'doctor'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Shifokor
            </span>
          </button>
        </div>

        <!-- Admin Login Form -->
        <form v-if="loginType === 'admin'" @submit.prevent="handleAdminLogin" class="space-y-5">
          <div>
            <label for="admin-login" class="block text-sm font-medium text-gray-700 mb-2">
              Login
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="admin-login"
                v-model="adminLogin"
                type="text"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Loginingizni kiriting"
              />
            </div>
          </div>

          <div>
            <label for="admin-password" class="block text-sm font-medium text-gray-700 mb-2">
              Parol
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="admin-password"
                v-model="adminPassword"
                type="password"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Parolingizni kiriting"
              />
            </div>
          </div>

          <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ authStore.error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-500/25"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Kirish...
            </span>
            <span v-else>Admin sifatida kirish</span>
          </button>
        </form>

        <!-- Doctor Login Form -->
        <form v-else @submit.prevent="handleDoctorLogin" class="space-y-5">
          <div>
            <label for="doctor-email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="doctor-email"
                v-model="doctorEmail"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="shifokor@example.com"
              />
            </div>
          </div>

          <div>
            <label for="doctor-password" class="block text-sm font-medium text-gray-700 mb-2">
              Parol
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="doctor-password"
                v-model="doctorPassword"
                type="password"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="Parolingizni kiriting"
              />
            </div>
          </div>

          <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ authStore.error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary-500/25"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Kirish...
            </span>
            <span v-else>Shifokor sifatida kirish</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-gray-400 text-sm mt-6">
        © 2024 ShifoCRM. Barcha huquqlar himoyalangan.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const loginType = ref('admin')
const adminLogin = ref('')
const adminPassword = ref('')
const doctorEmail = ref('')
const doctorPassword = ref('')
const isLoading = ref(false)

const handleAdminLogin = async () => {
  isLoading.value = true
  const success = await authStore.login({
    login: adminLogin.value,
    password: adminPassword.value
  })
  isLoading.value = false

  if (success) {
    toast.success('Tizimga muvaffaqiyatli kirdingiz!')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } else {
    toast.error('Login yoki parol noto\'g\'ri')
  }
}

const handleDoctorLogin = async () => {
  isLoading.value = true
  const success = await authStore.loginDoctor({
    email: doctorEmail.value,
    password: doctorPassword.value
  })
  isLoading.value = false

  if (success) {
    toast.success('Tizimga muvaffaqiyatli kirdingiz!')
    const redirect = route.query.redirect || '/doctor/profile'
    router.push(redirect)
  } else {
    toast.error('Email yoki parol noto\'g\'ri')
  }
}
</script>
