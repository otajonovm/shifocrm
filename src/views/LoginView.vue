<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-8">Login</h1>

      <!-- Login Type Tabs -->
      <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          @click="loginType = 'admin'"
          :class="[
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            loginType === 'admin'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Admin
        </button>
        <button
          @click="loginType = 'doctor'"
          :class="[
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            loginType === 'doctor'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Doctor
        </button>
      </div>

      <!-- Admin Login Form -->
      <form v-if="loginType === 'admin'" @submit.prevent="handleAdminLogin" class="space-y-6">
        <div>
          <label for="admin-login" class="block text-sm font-medium text-gray-700 mb-2">
            Login
          </label>
          <input
            id="admin-login"
            v-model="adminLogin"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter login"
          />
        </div>

        <div>
          <label for="admin-password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="admin-password"
            v-model="adminPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter password"
          />
        </div>

        <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ authStore.error }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? 'Logging in...' : 'Login as Admin' }}
        </button>
      </form>

      <!-- Doctor Login Form -->
      <form v-else @submit.prevent="handleDoctorLogin" class="space-y-6">
        <div>
          <label for="doctor-email" class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="doctor-email"
            v-model="doctorEmail"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="doctor@example.com"
          />
        </div>

        <div>
          <label for="doctor-password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="doctor-password"
            v-model="doctorPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter password"
          />
        </div>

        <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ authStore.error }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? 'Logging in...' : 'Login as Doctor' }}
        </button>
      </form>
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
