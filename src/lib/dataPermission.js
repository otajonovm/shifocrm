import {
  isGlobalSuperAdmin,
  isClinicOwner,
  isClinicAdmin,
  isDoctorLike,
  isSolo,
  isCashier,
  isReception,
  isAssistant,
  canViewClinicProfit,
} from '@/lib/roles'
import { DEFAULT_DATA_PERMISSIONS } from '@/stores/doctorPermissions'
import { checkMatrixDataPermission } from '@/lib/staffPermissions'

/**
 * Ma'lumot huquqini tekshirish (router va composable uchun).
 * Reception/Kassir/Assistent uchun clinic profit default deny.
 */
export function checkDataPermission(authStore, permissionKey, stores = {}) {
  if (!authStore?.isAuthenticated || !permissionKey) return false

  if (isGlobalSuperAdmin(authStore) || isClinicOwner(authStore) || isSolo(authStore)) {
    return true
  }

  if (permissionKey === 'can_view_revenue' && !canViewClinicProfit(authStore)) {
    // Kassir own KPI / reports.view matrix orqali alohida ochilishi mumkin,
    // lekin clinic profit default deny.
    if (isCashier(authStore) || isReception(authStore) || isAssistant(authStore)) {
      const employeeId = authStore.user?.employee_id
      const { employeePermsStore } = stores
      if (employeeId && employeePermsStore?.getMatrixPermissions) {
        const matrix = employeePermsStore.getMatrixPermissions(employeeId)
        if (matrix?.finance?.view_clinic_profit === true) return true
        if (matrix?.finance?.view_own_kpi === true && permissionKey === 'can_view_revenue') {
          return true
        }
      }
      return false
    }
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
      // Broad admin defaults olib tashlandi — faqat explicit employee_permissions
      return empPerms[permissionKey] === true
    }
    return false
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

  if (isCashier(authStore) || isReception(authStore) || isAssistant(authStore)) {
    const employeeId = authStore.user?.employee_id
    const { employeePermsStore } = stores
    if (employeeId && employeePermsStore) {
      const empPerms = employeePermsStore.getDataPermissions(employeeId)
      const matrix = employeePermsStore.getMatrixPermissions?.(employeeId)
      if (matrix && checkMatrixDataPermission(matrix, permissionKey)) return true
      return empPerms[permissionKey] === true
    }
    return false
  }

  return DEFAULT_DATA_PERMISSIONS[permissionKey] === true
}
