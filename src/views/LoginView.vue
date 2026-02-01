<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
    <div class="max-w-md w-full">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 overflow-hidden"
          :class="clinicStore.isCustomLogo ? 'bg-white border border-gray-100' : 'bg-gradient-to-r from-primary-500 to-primary-600'"
        >
          <img
            :src="clinicStore.logoUrl"
            alt="Logo"
            class="w-12 h-12 rounded-lg object-contain"
          />
        </div>
        <h1 class="text-3xl font-bold text-gray-900">{{ clinicStore.displayName }}</h1>
        <p class="text-gray-500 mt-2">{{ t('login.subtitle') }}</p>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <!-- Login Type Tabs -->
        <div class="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            @click="loginType = 'admin'"
            :class="[
              'flex-1 min-w-0 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
              loginType === 'admin'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {{ t('login.roleAdmin') }}
            </span>
          </button>
          <button
            @click="loginType = 'doctor'"
            :class="[
              'flex-1 min-w-0 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
              loginType === 'doctor'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('login.roleDoctor') }}
            </span>
          </button>
          <button
            @click="loginType = 'super_admin'"
            :class="[
              'flex-1 min-w-0 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
              loginType === 'super_admin'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ t('login.roleSuperAdmin') }}
            </span>
          </button>
        </div>

        <!-- Admin / Super Admin Login Form -->
        <form v-if="loginType === 'admin' || loginType === 'super_admin'" @submit.prevent="handleAdminLogin" class="space-y-5">
          <div>
            <label for="admin-login" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('login.adminLoginLabel') }}
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
                :placeholder="t('login.adminLoginPlaceholder')"
              />
            </div>
          </div>

          <div>
            <label for="admin-password" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('login.passwordLabel') }}
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
                :placeholder="t('login.passwordPlaceholder')"
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
              {{ t('login.loading') }}
            </span>
            <span v-else>{{ loginType === 'super_admin' ? t('login.submitSuperAdmin') : t('login.submitAdmin') }}</span>
          </button>
        </form>

        <!-- Doctor Login Form -->
        <form v-else @submit.prevent="handleDoctorLogin" class="space-y-5">
          <div>
            <label for="doctor-phone" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctors.phone') }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                id="doctor-phone"
                v-model="doctorPhone"
                type="tel"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                :placeholder="t('doctors.phonePlaceholder')"
              />
            </div>
          </div>

          <div>
            <label for="doctor-password" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('login.passwordLabel') }}
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
                :placeholder="t('login.passwordPlaceholder')"
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
              {{ t('login.loading') }}
            </span>
            <span v-else>{{ t('login.submitDoctor') }}</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-gray-400 text-sm mt-6">
        {{ t('login.footer') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useClinicStore } from '@/stores/clinic'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const toast = useToast()
const { t } = useI18n() // t() is used in script section for toast messages

const loginType = ref('admin')
const adminLogin = ref('')
const adminPassword = ref('')
const doctorPhone = ref('')
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
    toast.success(t('login.toastSuccess'))
    const defaultRedirect = authStore.userRole === 'super_admin' ? '/admin/clinics' : '/dashboard'
    const redirect = route.query.redirect || defaultRedirect
    router.push(redirect)
  } else {
    toast.error(t('auth.loginOrPasswordWrong'))
  }
}

const handleDoctorLogin = async () => {
  isLoading.value = true
  const success = await authStore.loginDoctor({
    phone: doctorPhone.value,
    password: doctorPassword.value
  })
  isLoading.value = false

  if (success) {
    toast.success(t('auth.loginSuccess'))
    const redirect = route.query.redirect || '/doctor/profile'
    router.push(redirect)
  } else {
    toast.error(t('auth.phoneOrPasswordWrong'))
  }
}
</script>
