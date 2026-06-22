import { describe, it, expect } from 'vitest'
import {
  createEmptyPermissionsMatrix,
  clonePermissionsMatrix,
  sectionAllChecked,
  sectionIndeterminate,
  toggleSection,
  defaultMatrixForRole,
} from './staffPermissionsMatrix.js'
import { syncLegacyPermissionFlags, matrixFromLegacyFlags } from './staffPermissions.js'

describe('staffPermissionsMatrix', () => {
  it('creates empty matrix with all false', () => {
    const m = createEmptyPermissionsMatrix()
    expect(m.patients.view).toBe(false)
    expect(m.finances.delete).toBe(false)
  })

  it('toggleSection sets all actions', () => {
    const m = createEmptyPermissionsMatrix()
    toggleSection(m, 'patients', true)
    expect(sectionAllChecked(m, 'patients')).toBe(true)
    toggleSection(m, 'patients', false)
    expect(sectionAllChecked(m, 'patients')).toBe(false)
  })

  it('sectionIndeterminate when partial selection', () => {
    const m = createEmptyPermissionsMatrix()
    m.patients.view = true
    expect(sectionIndeterminate(m, 'patients')).toBe(true)
    toggleSection(m, 'patients', true)
    expect(sectionIndeterminate(m, 'patients')).toBe(false)
  })

  it('clonePermissionsMatrix deep copies', () => {
    const src = createEmptyPermissionsMatrix()
    src.patients.view = true
    const copy = clonePermissionsMatrix(src)
    copy.patients.view = false
    expect(src.patients.view).toBe(true)
  })

  it('defaultMatrixForRole seeds administrator', () => {
    const m = defaultMatrixForRole('administrator')
    expect(m.patients.view).toBe(true)
    expect(m.finances.create).toBe(true)
  })
})

describe('staffPermissions legacy adapter', () => {
  it('syncLegacyPermissionFlags maps patients view to module flags', () => {
    const m = createEmptyPermissionsMatrix()
    m.patients.view = true
    m.finances.view = true
    const legacy = syncLegacyPermissionFlags(m)
    expect(legacy.module_permissions.can_view_patients).toBe(true)
    expect(legacy.can_view_revenue).toBe(true)
  })

  it('matrixFromLegacyFlags roundtrips permissions json', () => {
    const original = defaultMatrixForRole('doctor')
    const legacy = syncLegacyPermissionFlags(original)
    const restored = matrixFromLegacyFlags(legacy)
    expect(restored.patients.view).toBe(true)
  })
})
