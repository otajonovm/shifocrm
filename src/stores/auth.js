import { ref } from 'vue'
import { defineStore } from 'pinia'
import dbData from '../../db.json'
import * as doctorsApi from '@/api/doctorsApi'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const userRole = ref(localStorage.getItem('userRole') || null)
  const userId = ref(localStorage.getItem('userId') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  const error = ref(null)


  const login = async ({ login, password }) => {
    error.value = null
    try {
      if (dbData.admin.login === login && dbData.admin.password === password) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        return true
      } else {
        error.value = 'Invalid credentials'
        return false
      }
    } catch (error) {
      error.value = 'Login failed'
      return false
    }
  }

  const loginDoctor = async ({ email, password }) => {
    error.value = null
    try {
      const doctor = await doctorsApi.authenticateDoctor(email, password)
      if (!doctor) {
        error.value = 'Invalid email or password'
        return false
      }

      if (doctor.is_active === false) {
        error.value = 'Account is inactive'
        return false
      }

      // Update state
      isAuthenticated.value = true
      userRole.value = 'doctor'
      userId.value = doctor.id
      userEmail.value = doctor.email

      // Save to localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', 'doctor')
      localStorage.setItem('userId', doctor.id)
      localStorage.setItem('userEmail', doctor.email)

      return true
    } catch (err) {
      error.value = err.message || 'Login failed'
      return false
    }
  }

  const logout = async () => {
    isAuthenticated.value = false
    userRole.value = null
    userId.value = null
    userEmail.value = null
    error.value = null

    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
  }

  // Check if user is authenticated on app start (simple local check)
  const checkAuth = async () => {
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true'
    if (!storedAuth) {
      await logout()
      return
    }

    if (userRole.value === 'doctor' && !userId.value) {
      await logout()
    }
  }

  return {
    isAuthenticated,
    userRole,
    userId,
    userEmail,
    error,
    login,
    loginDoctor,
    logout,
    checkAuth

  }
})
