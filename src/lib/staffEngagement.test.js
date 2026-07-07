import { describe, it, expect } from 'vitest'
import {
  computeDaysInactive,
  isStaffInactive,
  buildStaffEngagementRows,
  filterInactiveStaff,
  aggregateLogsForEmployees,
  INACTIVE_THRESHOLD_DAYS,
} from '@/lib/staffEngagement'

describe('staffEngagement', () => {
  it('computeDaysInactive returns null when no activity', () => {
    expect(computeDaysInactive(null)).toBeNull()
  })

  it('flags staff inactive after threshold days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(isStaffInactive(computeDaysInactive(threeDaysAgo), INACTIVE_THRESHOLD_DAYS)).toBe(true)
    expect(isStaffInactive(0, INACTIVE_THRESHOLD_DAYS)).toBe(false)
    expect(isStaffInactive(null, INACTIVE_THRESHOLD_DAYS)).toBe(true)
  })

  it('counts patient views today per employee', () => {
    const employees = [
      { id: 'emp-1', full_name: 'Dr Ali', role: 'doctor', is_active: true },
    ]
    const today = new Date().toISOString()
    const logs = [
      { employee_id: 'emp-1', action: 'patient.view', created_at: today, details: {} },
      { employee_id: 'emp-1', action: 'patient.view', created_at: today, details: {} },
      { employee_id: 'emp-1', action: 'patient.update', created_at: today, details: {} },
    ]
    const stats = aggregateLogsForEmployees(logs, employees)
    const rows = buildStaffEngagementRows(employees, stats)
    expect(rows[0].patientViewsToday).toBe(2)
    expect(rows[0].patientUpdatesToday).toBe(1)
  })

  it('filterInactiveStaff returns only inactive rows', () => {
    const rows = [
      { employeeId: '1', isInactive: true, daysInactive: 5 },
      { employeeId: '2', isInactive: false, daysInactive: 0 },
    ]
    expect(filterInactiveStaff(rows)).toHaveLength(1)
    expect(filterInactiveStaff(rows)[0].employeeId).toBe('1')
  })
})
