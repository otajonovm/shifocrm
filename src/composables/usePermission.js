import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import {
  isClinicOwner,
  isGlobalSuperAdmin,
  isSolo,
  ROLES,
} from '@/lib/roles'

/**
 * Frontend permission enforcement.
 *
 * Owner, solo va superadmin — to'liq huquq.
 * Employee_id bo'lgan sessiyalar (admin yoki doctor) — JSONB matritsa, deny-by-default.
 * Clinic admin (employee_id yo'q) — to'liq clinic admin huquqi.
 * Doctor employee_id siz — ruxsat yo'q (staff wizard orqali bog'lanishi kerak).
 */
export function usePermission() {
  const authStore = useAuthStore()
  const employeePermissionsStore = useEmployeePermissionsStore()

  const employeeId = computed(() => authStore.user?.employee_id || null)
  const hasFullAccess = computed(() => (
    isGlobalSuperAdmin(authStore)
    || isClinicOwner(authStore)
    || isSolo(authStore)
    || (
      authStore.impersonatorRole === ROLES.SUPER_ADMIN
      && authStore.userRole === ROLES.ADMIN
    )
    || (
      authStore.userRole === ROLES.ADMIN
      && !employeeId.value
      && authStore.user?.account_type !== 'employee_admin'
    )
  ))

  const usesEmployeeMatrix = computed(() => Boolean(employeeId.value))
  const isReady = computed(() => (
    !usesEmployeeMatrix.value
    || employeePermissionsStore.isLoaded(employeeId.value)
  ))

  const ensurePermissions = async () => {
    if (!usesEmployeeMatrix.value) return null
    return employeePermissionsStore.ensureLoaded(employeeId.value)
  }

  const can = (section, action = 'view') => {
    if (!authStore.isAuthenticated) return false
    if (hasFullAccess.value) return true

    if (usesEmployeeMatrix.value) {
      if (!isReady.value) return false
      return employeePermissionsStore.can(employeeId.value, section, action)
    }

    // Doctor (va boshqa) sessiyalar employee bog'lanmasdan matritsadan o'tolmaydi.
    return false
  }

  const canAny = (checks = []) => {
    if (hasFullAccess.value) return true
    return checks.some(({ section, action = 'view' }) => can(section, action))
  }

  const canAll = (checks = []) => {
    if (hasFullAccess.value) return true
    return checks.every(({ section, action = 'view' }) => can(section, action))
  }

  return {
    employeeId,
    hasFullAccess,
    usesEmployeeMatrix,
    isReady,
    ensurePermissions,
    can,
    canAny,
    canAll,
  }
}
