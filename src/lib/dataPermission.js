import {
  isGlobalSuperAdmin,
  isClinicOwner,
  isClinicAdmin,
  isDoctorLike,
  isSolo,
} from '@/lib/roles'
import { DEFAULT_DATA_PERMISSIONS } from '@/stores/doctorPermissions'
import { checkMatrixDataPermission } from '@/lib/staffPermissions'

/** Klinika administratori (clinic_admins) uchun standart ruxsatlar */
export const CLINIC_ADMIN_DATA_DEFAULTS = {
  can_view_revenue: true,
  can_export_data: true,
  can_edit_prices: false,
  can_manage_medical_records: true,
  can_allow_debt_treatment: false,
}

/**
 * Ma'lumot huquqini tekshirish (router va composable uchun).
 * @param {import('@/stores/auth').useAuthStore} authStore
 * @param {string} permissionKey
 * @param {{ doctorPermsStore?: object, employeePermsStore?: object, employeesStore?: object }} stores
 */
export function checkDataPermission(authStore, permissionKey, stores = {}) {
  if (!authStore?.isAuthenticated || !permissionKey) return false

  if (isGlobalSuperAdmin(authStore) || isClinicOwner(authStore) || isSolo(authStore)) {
    return true
  }

  if (isClinicAdmin(authStore)) {
    const employeeId = authStore.user?.employee_id
    const { employeePermsStore } = stores
    if (employeeId && employeePermsStore) {
      const empPerms = employeePermsStore.getDataPermissions(employeeId)
      const matrix = employeePermsStore.getMatrixPermissions?.(employeeId)
      if (matrix && checkMatrixDataPermission(matrix, permissionKey)) {
        return true
      }
      return (
        empPerms[permissionKey] === true
        || CLINIC_ADMIN_DATA_DEFAULTS[permissionKey] === true
      )
    }
    return CLINIC_ADMIN_DATA_DEFAULTS[permissionKey] === true
  }

  if (isDoctorLike(authStore)) {
    const userId = authStore.user?.id
    const { doctorPermsStore, employeePermsStore, employeesStore } = stores

    if (userId && doctorPermsStore) {
      const doctorPerms = doctorPermsStore.getDataPermissions(userId)
      if (doctorPerms[permissionKey] === true) return true
    }

    const userPhone = authStore.user?.phone
    if (userPhone && employeesStore && employeePermsStore) {
      const employee = employeesStore.items?.find(
        (row) => row.phone && row.phone === userPhone
      )
      if (employee) {
        const empPerms = employeePermsStore.getDataPermissions(employee.id)
        if (empPerms[permissionKey] === true) return true
      }
    }

    return false
  }

  return DEFAULT_DATA_PERMISSIONS[permissionKey] === true
}
