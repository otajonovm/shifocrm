import { ref } from 'vue'
import { defineStore } from 'pinia'
import adminCredentials from '../../db.json'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const userRole = ref(localStorage.getItem('userRole') || null)
  const error = ref(null)

  const login = async ({ login, password }) => {
    error.value = null
    try {
      if (adminCredentials.admin.login === login && adminCredentials.admin.password === password) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        return true
      } else {
        error.value = 'Invalid credentials'
        return false
      }
    } catch (err) {
      error.value = 'Login failed'
      return false
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    userRole.value = null
    error.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
  }

  return { isAuthenticated, userRole, error, login, logout }
})
