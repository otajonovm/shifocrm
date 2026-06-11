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

  const getPermissions = (employeeId) => {
    if (!employeeId) return { ...DEFAULT_PERMISSIONS }
    return modulePermissionsMap.value[String(employeeId)] ?? { ...DEFAULT_PERMISSIONS }
  }

  const getDataPermissions = (employeeId) => {
    if (!employeeId) return { ...DEFAULT_DATA_PERMISSIONS }
    return dataPermissionsMap.value[String(employeeId)] ?? { ...DEFAULT_DATA_PERMISSIONS }
  }

  const loadFromEmployee = (employee) => {
    if (!employee?.id) return
    const id = String(employee.id)
    const perms = employee.employee_permissions ?? unwrapRelation(employee.employee_permissions)
    const { module_permissions: moduleField, ...scalarPerms } = perms || {}

    const moduleRaw = parsePermissionsField(moduleField)
    modulePermissionsMap.value = {
      ...modulePermissionsMap.value,
      [id]: mergeModulePermissions(moduleRaw),
    }

    dataPermissionsMap.value = {
      ...dataPermissionsMap.value,
      [id]: mergeDataPermissions(scalarPerms),
    }
  }

  const savePermissions = async (employeeId, modulePerms, dataPerms) => {
    const id = String(employeeId)
    const mergedModule = mergeModulePermissions(modulePerms)
    const mergedData = mergeDataPermissions(dataPerms)

    await updateEmployeePermissions(employeeId, {
      module_permissions: mergedModule,
      ...mergedData,
    })

    modulePermissionsMap.value = { ...modulePermissionsMap.value, [id]: mergedModule }
    dataPermissionsMap.value = { ...dataPermissionsMap.value, [id]: mergedData }

    return { module_permissions: mergedModule, data_permissions: mergedData }
  }

  return {
    modulePermissionsMap,
    dataPermissionsMap,
    getPermissions,
    getDataPermissions,
    loadFromEmployee,
    savePermissions,
  }
})
