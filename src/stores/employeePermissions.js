/**
 * employee_permissions jadvali + module_permissions JSONB
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getEmployeeById, updateEmployeePermissions } from '@/api/employeesApi'
import {
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
  return { ...DEFAULT_PERMISSIONS, ...(raw || {}) }
}

function mergeDataPermissions(raw) {
  return { ...DEFAULT_DATA_PERMISSIONS, ...(raw || {}) }
}

export const useEmployeePermissionsStore = defineStore('employeePermissions', () => {
  const modulePermissionsMap = ref({})
  const dataPermissionsMap = ref({})
  const matrixPermissionsMap = ref({})
  const loadedMap = ref({})
  const loadingMap = ref({})

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
    const perms = unwrapRelation(employee.employee_permissions)
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
    loadedMap.value = { ...loadedMap.value, [id]: true }
  }

  const isLoaded = (employeeId) => {
    if (!employeeId) return true
    return loadedMap.value[String(employeeId)] === true
  }

  const ensureLoaded = async (employeeId) => {
    if (!employeeId || isLoaded(employeeId)) return getMatrixPermissions(employeeId)
    const id = String(employeeId)
    if (loadingMap.value[id]) return loadingMap.value[id]

    const promise = getEmployeeById(employeeId)
      .then((employee) => {
        if (employee) loadFromEmployee(employee)
        else loadedMap.value = { ...loadedMap.value, [id]: true }
        return getMatrixPermissions(employeeId)
      })
      .finally(() => {
        const next = { ...loadingMap.value }
        delete next[id]
        loadingMap.value = next
      })

    loadingMap.value = { ...loadingMap.value, [id]: promise }
    return promise
  }

  const can = (employeeId, section, action = 'view') => {
    if (!employeeId || !section || !action) return false
    const matrix = getMatrixPermissions(employeeId)
    return matrix?.[section]?.[action] === true
  }

  const canAny = (employeeId, checks = []) =>
    checks.some(({ section, action = 'view' }) => can(employeeId, section, action))

  const canAll = (employeeId, checks = []) =>
    checks.every(({ section, action = 'view' }) => can(employeeId, section, action))

  const clear = () => {
    modulePermissionsMap.value = {}
    dataPermissionsMap.value = {}
    matrixPermissionsMap.value = {}
    loadedMap.value = {}
    loadingMap.value = {}
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
    loadedMap.value = { ...loadedMap.value, [id]: true }

    return {
      module_permissions: mergedModule,
      data_permissions: mergedData,
      permissions: synced.permissions,
    }
  }

  const saveMatrixPermissions = async (employeeId, matrix) => {
    const currentModule = getPermissions(employeeId)
    const currentData = getDataPermissions(employeeId)
    return savePermissions(employeeId, currentModule, currentData, matrix)
  }

  return {
    modulePermissionsMap,
    dataPermissionsMap,
    matrixPermissionsMap,
    loadedMap,
    getPermissions,
    getDataPermissions,
    getMatrixPermissions,
    loadFromEmployee,
    isLoaded,
    ensureLoaded,
    can,
    canAny,
    canAll,
    clear,
    savePermissions,
    saveMatrixPermissions,
  }
})
