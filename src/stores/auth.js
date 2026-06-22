import { ref } from 'vue'
import { defineStore } from 'pinia'
import { authenticateDoctor } from '@/api/doctorsApi'
import {
  authenticateClinicAdmin,
  authenticateClinicOwner,
  getClinic,
  findDoctorForSoloClinic,
} from '@/services/adminService'
import { authenticateEmployee } from '@/api/employeesApi'
import {
  migrateLegacyClinicOwnerSession,
  ROLES,
  resolveClinicOwnerSessionRole,
  resolveDoctorLoginRole,
  employeeDbRoleToAuthRole,
} from '@/lib/roles'

const USER_CLINIC_KEY = 'userClinicId'
const IMPERSONATOR_ROLE_KEY = 'impersonatorRole'
const SUPER_ADMIN_SCOPE_KEY = 'superAdminScope'

/** Admin/SuperAdmin kirish ma'lumotlari: avval env, keyin db.json (ixtiyoriy) */
async function getAdminCredentials() {
  const env = {
    admin: import.meta.env.VITE_ADMIN_LOGIN && import.meta.env.VITE_ADMIN_PASSWORD
      ? { login: import.meta.env.VITE_ADMIN_LOGIN, password: import.meta.env.VITE_ADMIN_PASSWORD }
      : null,
    superAdmin: import.meta.env.VITE_SUPERADMIN_LOGIN && import.meta.env.VITE_SUPERADMIN_PASSWORD
      ? { login: import.meta.env.VITE_SUPERADMIN_LOGIN, password: import.meta.env.VITE_SUPERADMIN_PASSWORD }
      : null
  }
  try {
    const file = (await import('../../db.json')).default
    return {
      admin: env.admin ?? file?.admin ?? null,
      superAdmin: env.superAdmin ?? file?.superAdmin ?? null
    }
  } catch {
    return { admin: env.admin, superAdmin: env.superAdmin }
  }
}

/** clinic_owner sifatida saqlangan yakka stom sessiyasini solo ga tuzatish */
async function repairSoloOwnerSession(getClinicFn, userRef, userRoleRef) {
  const storedRole = localStorage.getItem('userRole')
  const clinicIdRaw = localStorage.getItem(USER_CLINIC_KEY)
  if (storedRole !== ROLES.CLINIC_OWNER || !clinicIdRaw) return

  const clinicId = Number(clinicIdRaw)
  if (!Number.isFinite(clinicId)) return

  try {
    const clinic = await getClinicFn(clinicId)
    if (resolveClinicOwnerSessionRole(clinic) !== ROLES.SOLO) return

    userRoleRef.value = ROLES.SOLO
    localStorage.setItem('userRole', ROLES.SOLO)

    if (userRef.value && typeof userRef.value === 'object') {
      const nextUser = { ...userRef.value, account_type: 'solo' }
      userRef.value = nextUser
      localStorage.setItem('user', JSON.stringify(nextUser))
    }
  } catch {
    // sessiya tuzatish ixtiyoriy
  }
}

export const useAuthStore = defineStore('auth', () => {
  if (migrateLegacyClinicOwnerSession()) {
    // Eski sessiya yangi clinic_owner rolga o'tkazildi
  }

  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const userRole = ref(localStorage.getItem('userRole') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  let parsedUser = null
  try {
    const rawUser = localStorage.getItem('user')
    parsedUser = rawUser ? JSON.parse(rawUser) : null
  } catch {
    localStorage.removeItem('user')
  }
  const user = ref(parsedUser)
  const userClinicId = ref(localStorage.getItem(USER_CLINIC_KEY) ? Number(localStorage.getItem(USER_CLINIC_KEY)) : null)
  const impersonatorRole = ref(localStorage.getItem(IMPERSONATOR_ROLE_KEY) || null)
  const superAdminScope = ref(localStorage.getItem(SUPER_ADMIN_SCOPE_KEY) || null)
  const error = ref(null)

  repairSoloOwnerSession(getClinic, user, userRole)

  const login = async ({ login: loginVal, password }) => {
    error.value = null
    try {
      const adminCredentials = await getAdminCredentials()

      if (adminCredentials.superAdmin?.login === loginVal && adminCredentials.superAdmin?.password === password) {
        isAuthenticated.value = true
        userRole.value = 'super_admin'
        userEmail.value = null
        user.value = null
        userClinicId.value = null
        impersonatorRole.value = null
        superAdminScope.value = 'global'
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'super_admin')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('user')
        localStorage.removeItem(USER_CLINIC_KEY)
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        localStorage.setItem(SUPER_ADMIN_SCOPE_KEY, 'global')
        return true
      }

      const clinicOwner = await authenticateClinicOwner(loginVal, password)
      if (clinicOwner) {
        const clinicId = Number(clinicOwner.clinic_id)
        let clinic = null
        try {
          clinic = await getClinic(clinicId)
        } catch {
          clinic = null
        }

        const role = resolveClinicOwnerSessionRole(clinic)
        const isSoloSession = role === ROLES.SOLO
        let sessionUser = {
          login: clinicOwner.login,
          clinic_id: clinicId,
          owner_id: clinicOwner.id,
          account_type: isSoloSession ? 'solo' : 'clinic_owner',
        }

        if (isSoloSession) {
          try {
            const doctor = await findDoctorForSoloClinic(clinicId, loginVal)
            if (doctor) {
              sessionUser = {
                id: doctor.id,
                full_name: doctor.full_name,
                email: doctor.email,
                phone: doctor.phone,
                specialization: doctor.specialization,
                is_active: doctor.is_active,
                patients_scope: doctor.patients_scope || 'own',
                clinic_id: clinicId,
                login: clinicOwner.login,
                account_type: 'solo',
              }
            }
          } catch {
            // owner sessiyasi davom etadi
          }
        }

        isAuthenticated.value = true
        userRole.value = role
        userEmail.value = sessionUser.email || sessionUser.phone || sessionUser.login || null
        user.value = sessionUser
        userClinicId.value = clinicId
        impersonatorRole.value = null
        superAdminScope.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', role)
        if (userEmail.value) {
          localStorage.setItem('userEmail', userEmail.value)
        } else {
          localStorage.removeItem('userEmail')
        }
        localStorage.setItem('user', JSON.stringify(sessionUser))
        localStorage.setItem(USER_CLINIC_KEY, String(clinicId))
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
        return true
      }
      const clinicAdmin = await authenticateClinicAdmin(loginVal, password)
      if (clinicAdmin) {
        const adminUser = {
          login: clinicAdmin.login,
          clinic_id: clinicAdmin.clinic_id,
          admin_id: clinicAdmin.id,
          account_type: 'clinic_admin',
        }

        isAuthenticated.value = true
        userRole.value = ROLES.ADMIN
        userEmail.value = null
        user.value = adminUser
        userClinicId.value = clinicAdmin.clinic_id
        impersonatorRole.value = null
        superAdminScope.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', ROLES.ADMIN)
        localStorage.removeItem('userEmail')
        localStorage.setItem('user', JSON.stringify(adminUser))
        localStorage.setItem(USER_CLINIC_KEY, String(clinicAdmin.clinic_id))
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
        return true
      }

      const staffEmployee = await authenticateEmployee(loginVal, password)
      const staffAuthRole = staffEmployee ? employeeDbRoleToAuthRole(staffEmployee.role) : null
      if (staffEmployee && staffAuthRole) {
        const clinicId = staffEmployee.clinic_id != null && Number.isFinite(Number(staffEmployee.clinic_id))
          ? Number(staffEmployee.clinic_id)
          : null

        if (clinicId != null) {
          try {
            const clinic = await getClinic(clinicId)
            if (!clinic || clinic.is_active === false) {
              error.value = 'Invalid credentials'
              return false
            }
          } catch {
            // klinika tekshiruvi muvaffaqiyatsiz bo'lsa ham kirishga ruxsat (demo)
          }
        }

        const employeeUser = {
          employee_id: staffEmployee.id,
          full_name: staffEmployee.full_name,
          email: staffEmployee.email,
          phone: staffEmployee.phone,
          clinic_id: clinicId,
          account_type: 'employee_admin',
          login: String(loginVal).trim(),
        }

        isAuthenticated.value = true
        userRole.value = staffAuthRole
        userEmail.value = staffEmployee.email || staffEmployee.phone || null
        user.value = employeeUser
        userClinicId.value = clinicId
        impersonatorRole.value = null
        superAdminScope.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', staffAuthRole)
        if (userEmail.value) {
          localStorage.setItem('userEmail', userEmail.value)
        } else {
          localStorage.removeItem('userEmail')
        }
        localStorage.setItem('user', JSON.stringify(employeeUser))
        if (clinicId != null) {
          localStorage.setItem(USER_CLINIC_KEY, String(clinicId))
        } else {
          localStorage.removeItem(USER_CLINIC_KEY)
        }
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
        return true
      }

      if (adminCredentials.admin?.login === loginVal && adminCredentials.admin?.password === password) {
        isAuthenticated.value = true
        userRole.value = 'admin'
        userEmail.value = null
        user.value = null
        userClinicId.value = null
        impersonatorRole.value = null
        superAdminScope.value = null
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', 'admin')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('user')
        localStorage.removeItem(USER_CLINIC_KEY)
        localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
        localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
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
    superAdminScope.value = null
    error.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('user')
    localStorage.removeItem(USER_CLINIC_KEY)
    localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
    localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
  }

  const loginDoctor = async ({ phone, password }) => {
    error.value = null
    try {
      const doctor = await authenticateDoctor(phone, password)
      if (!doctor) {
        error.value = 'Invalid credentials'
        return false
      }

      const cid = doctor.clinic_id != null && Number.isFinite(Number(doctor.clinic_id)) ? Number(doctor.clinic_id) : null
      const safeDoctor = {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        is_active: doctor.is_active,
        patients_scope: doctor.patients_scope || 'own',
        clinic_id: cid,
      }

      let role = ROLES.DOCTOR
      if (cid != null) {
        try {
          const clinic = await getClinic(cid)
          role = resolveDoctorLoginRole(clinic)
        } catch {
          role = ROLES.DOCTOR
        }
      }

      isAuthenticated.value = true
      userRole.value = role
      userEmail.value = doctor.email || doctor.phone
      user.value = safeDoctor
      impersonatorRole.value = null
      superAdminScope.value = null
      if (cid != null) {
        userClinicId.value = cid
        localStorage.setItem(USER_CLINIC_KEY, String(cid))
      } else {
        userClinicId.value = null
        localStorage.removeItem(USER_CLINIC_KEY)
      }
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', role)
      localStorage.setItem('userEmail', doctor.email || doctor.phone)
      localStorage.setItem('user', JSON.stringify(safeDoctor))
      localStorage.removeItem(IMPERSONATOR_ROLE_KEY)
      localStorage.removeItem(SUPER_ADMIN_SCOPE_KEY)
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
    superAdminScope,
    isImpersonating,
    error,
    login,
    loginDoctor,
    logout,
    startClinicSession: startClinicSessionWrapped,
    stopClinicSession: stopClinicSessionWrapped,
  }
})
