import { ref } from 'vue'
import { defineStore } from 'pinia'
import adminCredentials from '../../db.json'
import { authenticateDoctor } from '@/api/doctorsApi'
import { authenticateClinicAdmin } from '@/services/adminService'

const USER_CLINIC_KEY = 'userClinicId'
const IMPERSONATOR_ROLE_KEY = 'impersonatorRole'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const userRole = ref(localStorage.getItem('userRole') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const userClinicId = ref(localStorage.getItem(USER_CLINIC_KEY) ? Number(localStorage.getItem(USER_CLINIC_KEY)) : null)
  const impersonatorRole = ref(localStorage.getItem(IMPERSONATOR_ROLE_KEY) || null)
  const error = ref(null)

  const login = async ({ login, password }) => {
    error.value = null
    try {
      if (adminCredentials.admin?.login === login && adminCredentials.admin?.password === password) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        userEmail.value = null
        user.value = null
        userClinicId.value = null
        impersonatorRole.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('user')
        localStorage.removeItem(USER_CLINIC_KEY)
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        return true
      }
      if (adminCredentials.superAdmin?.login === login && adminCredentials.superAdmin?.password === password) {
        isAuthenticated.value = true
        userRole.value = 'super_admin'
        userEmail.value = null
        user.value = null
        userClinicId.value = null
        impersonatorRole.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'super_admin')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('user')
        localStorage.removeItem(USER_CLINIC_KEY)
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        return true
      }
      const clinicAdmin = await authenticateClinicAdmin(login, password)
      if (clinicAdmin) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        userEmail.value = null
        user.value = { login: clinicAdmin.login, clinic_id: clinicAdmin.clinic_id }
        userClinicId.value = clinicAdmin.clinic_id
        impersonatorRole.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        localStorage.removeItem('userEmail')
        localStorage.setItem('user', JSON.stringify({ login: clinicAdmin.login, clinic_id: clinicAdmin.clinic_id }))
        localStorage.setItem(USER_CLINIC_KEY, String(clinicAdmin.clinic_id))
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        return true
      }
      error.value = 'Invalid credentials'
      return false
    } catch (e) {
      console.error('Login failed:', e)
      error.value = 'Login failed'
      return false
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    userRole.value = null
    userEmail.value = null
    user.value = null
    userClinicId.value = null
    impersonatorRole.value = null
    error.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('user')
    localStorage.removeItem(USER_CLINIC_KEY)
    localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
  }

  const loginDoctor = async ({ email, password }) => {
    error.value = null
    try {
      const doctor = await authenticateDoctor(email, password)
      if (!doctor) {
        error.value = 'Invalid credentials'
        return false
      }

      const cid = doctor.clinic_id != null && Number.isFinite(Number(doctor.clinic_id)) ? Number(doctor.clinic_id) : null
      const safeDoctor = {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        is_active: doctor.is_active,
        clinic_id: cid,
      }

      isAuthenticated.value = true
      userRole.value = 'doctor'
      userEmail.value = doctor.email
      user.value = safeDoctor
      impersonatorRole.value = null
      if (cid != null) {
        userClinicId.value = cid
        localStorage.setItem(USER_CLINIC_KEY, String(cid))
      } else {
        userClinicId.value = null
        localStorage.removeItem(USER_CLINIC_KEY)
      }
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', 'doctor')
      localStorage.setItem('userEmail', doctor.email)
      localStorage.setItem('user', JSON.stringify(safeDoctor))
      localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
      return true
    } catch (err) {
      console.error('Doctor login failed:', err)
      error.value = 'Login failed'
      return false
    }
  }

  /**
   * Super admin klinika kontekstiga kiradi (impersonation).
   * Bu paytda UI va router "admin" kabi ishlaydi, lekin super admin qaytishi mumkin.
   * @param {number|string} clinicId
   */
  const startClinicSession = (clinicId) => {
    const id = Number(clinicId)
    if (!Number.isFinite(id)) return
    // Only allow when current session is super admin (or already impersonating as super admin)
    const current = localStorage.getItem('userRole')
    const imp = localStorage.getItem(IMPERSONATOR_ROLE_KEY)
    if (current !== 'super_admin' && imp !== 'super_admin') return

    impersonatorRole.value = 'super_admin'
    localStorage.setItem(IMPERSONATOR_ROLE_KEY, 'super_admin')

    userRole.value = 'admin'
    localStorage.setItem('userRole', 'admin')

    userClinicId.value = id
    localStorage.setItem(USER_CLINIC_KEY, String(id))
  }

  /**
   * Super admin klinika kontekstidan chiqadi.
   */
  const stopClinicSession = () => {
    if (impersonatorRole.value !== 'super_admin' && localStorage.getItem(IMPERSONATOR_ROLE_KEY) !== 'super_admin') return

    impersonatorRole.value = null
    localStorage.removeItem(IMPERSONATOR_ROLE_KEY)

    userClinicId.value = null
    localStorage.removeItem(USER_CLINIC_KEY)

    userRole.value = 'super_admin'
    localStorage.setItem('userRole', 'super_admin')
  }

  const isImpersonating = ref(impersonatorRole.value === 'super_admin')

  // keep isImpersonating reactive-ish when methods called
  const syncImpersonatingFlag = () => {
    isImpersonating.value = (localStorage.getItem(IMPERSONATOR_ROLE_KEY) === 'super_admin')
  }

  const startClinicSessionWrapped = (clinicId) => {
    startClinicSession(clinicId)
    syncImpersonatingFlag()
  }

  const stopClinicSessionWrapped = () => {
    stopClinicSession()
    syncImpersonatingFlag()
  }

  return {
    isAuthenticated,
    userRole,
    userEmail,
    user,
    userClinicId,
    impersonatorRole,
    isImpersonating,
    error,
    login,
    loginDoctor,
    logout,
    startClinicSession: startClinicSessionWrapped,
    stopClinicSession: stopClinicSessionWrapped,
  }
})
