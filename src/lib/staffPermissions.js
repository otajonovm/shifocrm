/**
 * JSONB permissions matritsa ↔ legacy module/data flags adapter.
 * Router va Sidebar mavjud mantiqini buzmasdan yangi matritsani saqlash.
 */

import {
  DEFAULT_DATA_PERMISSIONS,
  DEFAULT_PERMISSIONS,
} from '@/stores/doctorPermissions'
import {
  clonePermissionsMatrix,
  createEmptyPermissionsMatrix,
} from '@/lib/staffPermissionsMatrix'

/** Matritsadan legacy scalar + module_permissions yaratish */
export function syncLegacyPermissionFlags(matrix) {
  const m = clonePermissionsMatrix(matrix)
  const module_permissions = { ...DEFAULT_PERMISSIONS }
  const data_permissions = { ...DEFAULT_DATA_PERMISSIONS }

  if (m.patients?.view) module_permissions.can_view_patients = true
  if (m.patients?.create) module_permissions.can_add_patients = true
  if (m.patients?.edit || m.patients?.create) {
    module_permissions.can_view_patients = true
  }
  if (m.patients?.view) module_permissions.can_view_dashboard = true

  if (m.finances?.view) data_permissions.can_view_revenue = true
  if (m.analytics?.view) data_permissions.can_view_revenue = true
  if (m.settings?.edit) data_permissions.can_edit_prices = true
  if (m.patients?.edit || m.patients?.delete) {
    data_permissions.can_manage_medical_records = true
  }
  if (m.analytics?.view || m.finances?.view) {
    data_permissions.can_export_data = true
  }

  if (m.patients?.view) module_permissions.can_view_appointments = true
  if (m.patients?.view) module_permissions.can_view_leads = true
  if (m.patients?.view) module_permissions.can_view_treatment_plans = true
  module_permissions.can_edit_profile = true

  return {
    permissions: m,
    module_permissions,
    ...data_permissions,
  }
}

/** Legacy flaglardan matritsa tiklash (edit preload) */
export function matrixFromLegacyFlags({ module_permissions, data_permissions, permissions } = {}) {
  if (permissions && typeof permissions === 'object') {
    return clonePermissionsMatrix(permissions)
  }

  const matrix = createEmptyPermissionsMatrix()
  const mod = { ...DEFAULT_PERMISSIONS, ...(module_permissions || {}) }
  const data = { ...DEFAULT_DATA_PERMISSIONS, ...(data_permissions || {}) }

  if (mod.can_view_patients || mod.can_add_patients) {
    matrix.patients.view = !!mod.can_view_patients || !!mod.can_add_patients
    matrix.patients.create = !!mod.can_add_patients
    matrix.patients.edit = !!mod.can_add_patients
  }
  if (data.can_view_revenue) {
    matrix.finances.view = true
    matrix.analytics.view = true
  }
  if (data.can_edit_prices) {
    matrix.settings.view = true
    matrix.settings.edit = true
  }
  if (data.can_export_data) {
    matrix.analytics.view = true
  }
  if (data.can_manage_medical_records) {
    matrix.patients.edit = true
    matrix.patients.delete = true
  }
  if (mod.can_view_appointments) {
    matrix.patients.view = true
  }

  return matrix
}

/** Router dataPermission kalitlarini matritsadan tekshirish */
export function checkMatrixDataPermission(matrix, permissionKey) {
  const m = matrix || createEmptyPermissionsMatrix()
  switch (permissionKey) {
    case 'can_view_revenue':
      return !!(m.finances?.view || m.analytics?.view)
    case 'can_export_data':
      return !!(m.analytics?.view && (m.analytics?.create || m.finances?.view))
    case 'can_edit_prices':
      return !!m.settings?.edit
    case 'can_manage_medical_records':
      return !!(m.patients?.edit || m.patients?.delete)
    default:
      return false
  }
}
