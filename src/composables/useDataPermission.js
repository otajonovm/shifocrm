import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDoctorPermissionsStore } from '@/stores/doctorPermissions'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import { useEmployeesStore } from '@/stores/employees'
import { checkDataPermission } from '@/lib/dataPermission'
import { useToast } from '@/composables/useToast'

/**
 * Ma'lumot huquqlarini tekshirish (moliyaviy, eksport, preyskurant, tibbiy yozuvlar).
 *
 * @param {keyof import('@/stores/doctorPermissions').DEFAULT_DATA_PERMISSIONS | string} permissionKey
 */
export function useDataPermission(permissionKey) {
  const authStore = useAuthStore()
  const doctorPermsStore = useDoctorPermissionsStore()
  const employeePermsStore = useEmployeePermissionsStore()
  const employeesStore = useEmployeesStore()

  const allowed = computed(() =>
    checkDataPermission(authStore, permissionKey, {
      doctorPermsStore,
      employeePermsStore,
      employeesStore,
    })
  )

  const check = () => allowed.value

  return {
    allowed,
    check,
  }
}

/**
 * Sahifaga kirishda huquq yo'q bo'lsa dashboardga qaytaradi.
 *
 * @example
 * useDataPermissionGuard('can_view_revenue', {
 *   message: "Moliyaviy bo'limga kirish huquqingiz yo'q.",
 * })
 */
export function useDataPermissionGuard(permissionKey, options = {}) {
  const router = useRouter()
  const toast = useToast()
  const { allowed } = useDataPermission(permissionKey)

  const {
    redirect = { name: 'dashboard' },
    message = "Sizda bu bo'limga kirish huquqi yo'q.",
    immediate = true,
  } = options

  watch(
    allowed,
    (ok) => {
      if (!ok) {
        toast.error(message)
        router.replace(redirect)
      }
    },
    { immediate }
  )

  return { allowed }
}
