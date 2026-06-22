/**
 * employee_permissions jadvali + module_permissions JSONB
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updateEmployeePermissions } from '@/api/employeesApi'
import {
  MODULE_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  DEFAULT_DATA_PERMISSIONS,
  parsePermissionsField,
} from '@/stores/doctorPermissions'
import { unwrapRelation } from '@/lib/staffHelpers'
import {
  clonePermissionsMatrix,
  defaultMatrixForRole,
} from '@/lib/staffPermissionsMatrix'
import {
  matrixFromLegacyFlags,
  syncLegacyPermissionFlags,
} from '@/lib/staffPermissions'

function mergeModulePermissions(raw) {
  const merged = { ...DEFAULT_PERMISSIONS, ...(raw || {}) }
  MODULE_PERMISSIONS.forEach((m) => {
    if (m.alwaysEnabled) merged[m.key] = true
  })
  return merged
}

function mergeDataPermissions(raw) {
  return { ...DEFAULT_DATA_PERMISSIONS, ...(raw || {}) }
}

export const useEmployeePermissionsStore = defineStore('employeePermissions', () => {
  const modulePermissionsMap = ref({})
  const dataPermissionsMap = ref({})
  const matrixPermissionsMap = ref({})

  const getPermissions = (employeeId) => {
    if (!employeeId) return { ...DEFAULT_PERMISSIONS }
    return modulePermissionsMap.value[String(employeeId)] ?? { ...DEFAULT_PERMISSIONS }
  }

  const getDataPermissions = (employeeId) => {
    if (!employeeId) return { ...DEFAULT_DATA_PERMISSIONS }
    return dataPermissionsMap.value[String(employeeId)] ?? { ...DEFAULT_DATA_PERMISSIONS }
  }

  const getMatrixPermissions = (employeeId) => {
    if (!employeeId) return clonePermissionsMatrix()
    return matrixPermissionsMap.value[String(employeeId)] ?? clonePermissionsMatrix()
  }

  const loadFromEmployee = (employee) => {
    if (!employee?.id) return
    const id = String(employee.id)
    const perms = employee.employee_permissions ?? unwrapRelation(employee.employee_permissions)
    const {
      module_permissions: moduleField,
      permissions: permissionsField,
      ...scalarPerms
    } = perms || {}

    const moduleRaw = parsePermissionsField(moduleField)
    const permissionsRaw = parsePermissionsField(permissionsField)

    modulePermissionsMap.value = {
      ...modulePermissionsMap.value,
      [id]: mergeModulePermissions(moduleRaw),
    }

    dataPermissionsMap.value = {
      ...dataPermissionsMap.value,
      [id]: mergeDataPermissions(scalarPerms),
    }

    matrixPermissionsMap.value = {
      ...matrixPermissionsMap.value,
      [id]: matrixFromLegacyFlags({
        module_permissions: mergeModulePermissions(moduleRaw),
        data_permissions: mergeDataPermissions(scalarPerms),
        permissions: permissionsRaw,
      }),
    }
  }

  const savePermissions = async (employeeId, modulePerms, dataPerms, matrix) => {
    const id = String(employeeId)
    const mergedMatrix = clonePermissionsMatrix(
      matrix ?? matrixPermissionsMap.value[id] ?? defaultMatrixForRole('assistant')
    )
    const synced = syncLegacyPermissionFlags(mergedMatrix)
    const mergedModule = mergeModulePermissions(synced.module_permissions)
    const mergedData = mergeDataPermissions({
      can_view_revenue: synced.can_view_revenue,
      can_export_data: synced.can_export_data,
      can_edit_prices: synced.can_edit_prices,
      can_manage_medical_records: synced.can_manage_medical_records,
      can_allow_debt_treatment: synced.can_allow_debt_treatment,
      ...dataPerms,
    })

    await updateEmployeePermissions(employeeId, {
      permissions: synced.permissions,
      module_permissions: mergedModule,
      ...mergedData,
    })

    modulePermissionsMap.value = { ...modulePermissionsMap.value, [id]: mergedModule }
    dataPermissionsMap.value = { ...dataPermissionsMap.value, [id]: mergedData }
    matrixPermissionsMap.value = { ...matrixPermissionsMap.value, [id]: synced.permissions }

    return {
      module_permissions: mergedModule,
      data_permissions: mergedData,
      permissions: synced.permissions,
    }
  }

  const saveMatrixPermissions = async (employeeId, matrix) => {
    const id = String(employeeId)
    const currentModule = getPermissions(employeeId)
    const currentData = getDataPermissions(employeeId)
    return savePermissions(employeeId, currentModule, currentData, matrix)
  }

  return {
    modulePermissionsMap,
    dataPermissionsMap,
    matrixPermissionsMap,
    getPermissions,
    getDataPermissions,
    getMatrixPermissions,
    loadFromEmployee,
    savePermissions,
    saveMatrixPermissions,
  }
})
