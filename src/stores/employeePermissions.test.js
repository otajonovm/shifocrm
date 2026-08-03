import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeePermissionsStore } from './employeePermissions'

vi.mock('@/api/employeesApi', () => ({
  getEmployeeById: vi.fn(),
  updateEmployeePermissions: vi.fn(),
}))

describe('employeePermissions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads JSONB matrix and checks granular actions', () => {
    const store = useEmployeePermissionsStore()
    store.loadFromEmployee({
      id: 'employee-1',
      employee_permissions: {
        permissions: {
          patients: { view: true, create: false, edit: true, delete: false },
          appointments: { view: true, create: true, edit: false, delete: false },
        },
      },
    })

    expect(store.isLoaded('employee-1')).toBe(true)
    expect(store.can('employee-1', 'patients', 'view')).toBe(true)
    expect(store.can('employee-1', 'patients', 'create')).toBe(false)
    expect(store.can('employee-1', 'appointments', 'create')).toBe(true)
    expect(store.can('employee-1', 'warehouse', 'view')).toBe(false)
  })

  it('unwraps PostgREST relation arrays', () => {
    const store = useEmployeePermissionsStore()
    store.loadFromEmployee({
      id: 'employee-2',
      employee_permissions: [{
        permissions: {
          staff: { view: true, create: false, edit: false, delete: false },
        },
      }],
    })

    expect(store.can('employee-2', 'staff', 'view')).toBe(true)
  })

  it('denies missing employees and supports any/all checks', () => {
    const store = useEmployeePermissionsStore()
    expect(store.can(null, 'patients', 'view')).toBe(false)

    store.loadFromEmployee({
      id: 'employee-3',
      employee_permissions: {
        permissions: {
          reports: { view: true, create: true, edit: false, delete: false },
        },
      },
    })

    expect(store.canAny('employee-3', [
      { section: 'warehouse', action: 'view' },
      { section: 'reports', action: 'view' },
    ])).toBe(true)
    expect(store.canAll('employee-3', [
      { section: 'reports', action: 'view' },
      { section: 'reports', action: 'create' },
    ])).toBe(true)
  })
})
