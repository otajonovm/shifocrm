import { describe, it, expect } from 'vitest'
import {
  parsePermissionsField,
  DEFAULT_PERMISSIONS,
  DEFAULT_DATA_PERMISSIONS,
  MODULE_PERMISSIONS,
} from './doctorPermissions.js'

describe('doctorPermissions', () => {
  it('parsePermissionsField parses JSON string', () => {
    expect(parsePermissionsField('{"can_view_patients":false}')).toEqual({
      can_view_patients: false,
    })
  })

  it('parsePermissionsField returns object as-is', () => {
    const obj = { can_view_leads: true }
    expect(parsePermissionsField(obj)).toBe(obj)
  })

  it('parsePermissionsField returns null for invalid JSON', () => {
    expect(parsePermissionsField('{bad')).toBeNull()
    expect(parsePermissionsField(null)).toBeNull()
  })

  it('DEFAULT_PERMISSIONS enables all module keys', () => {
    MODULE_PERMISSIONS.forEach((m) => {
      expect(DEFAULT_PERMISSIONS[m.key]).toBe(true)
    })
  })

  it('DEFAULT_DATA_PERMISSIONS are false by default', () => {
    expect(DEFAULT_DATA_PERMISSIONS.can_view_revenue).toBe(false)
    expect(DEFAULT_DATA_PERMISSIONS.can_export_data).toBe(false)
    expect(DEFAULT_DATA_PERMISSIONS.can_edit_prices).toBe(false)
    expect(DEFAULT_DATA_PERMISSIONS.can_manage_medical_records).toBe(false)
    expect(DEFAULT_DATA_PERMISSIONS.can_allow_debt_treatment).toBe(false)
  })
})
