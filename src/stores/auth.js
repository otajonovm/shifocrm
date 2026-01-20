import { ref } from 'vue'
import { defineStore } from 'pinia'
import adminCredentials from '../../db.json'
import { authenticateDoctor } from '@/api/doctorsApi'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const userRole = ref(localStorage.getItem('userRole') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const error = ref(null)

  const login = async ({ login, password }) => {
    error.value = null
    try {
      if (adminCredentials.admin.login === login && adminCredentials.admin.password === password) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        userEmail.value = null
        user.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('user')
        return true
      } else {
        error.value = 'Invalid credentials'
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      error.value = 'Login failed'
      return false
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    userRole.value = null
    userEmail.value = null
    user.value = null
    error.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('user')
  }

  const loginDoctor = async ({ email, password }) => {
    error.value = null
    try {
      const doctor = await authenticateDoctor(email, password)
      if (!doctor) {
        error.value = 'Invalid credentials'
        return false
      }

      const safeDoctor = {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        is_active: doctor.is_active,
      }

      isAuthenticated.value = true
      userRole.value = 'doctor'
      userEmail.value = doctor.email
      user.value = safeDoctor
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', 'doctor')
      localStorage.setItem('userEmail', doctor.email)
      localStorage.setItem('user', JSON.stringify(safeDoctor))
      return true
    } catch (err) {
      console.error('Doctor login failed:', err)
      error.value = 'Login failed'
      return false
    }
  }

  return { isAuthenticated, userRole, userEmail, user, error, login, loginDoctor, logout }
})
