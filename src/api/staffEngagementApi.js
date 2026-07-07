/**
 * Xodimlar tizim faolligi hisoboti.
 */

import { getAllEmployees } from '@/api/employeesApi'
import { listDoctors } from '@/api/doctorsApi'
import { listActivityLogsSince, fetchStaffEngagementRpc } from '@/api/activityLogsApi'
import { getCurrentClinicId } from '@/lib/clinicContext'
import {
  aggregateLogsForEmployees,
  buildStaffEngagementRows,
  filterInactiveStaff,
  mergeRpcStats,
  TRACKED_STAFF_ROLES,
} from '@/lib/staffEngagement'

const SINCE_DAYS = 90

/** employees bo'sh bo'lsa legacy doctors jadvalidan fallback */
const resolveTrackedStaff = async (clinicId, allEmployees = []) => {
  let employees = (allEmployees || []).filter(
    (e) => e?.is_active !== false && TRACKED_STAFF_ROLES.has(String(e.role || '').toLowerCase())
  )

  if (employees.length > 0 || !clinicId) return employees

  try {
    const doctors = await listDoctors()
    const activeDoctors = (Array.isArray(doctors) ? doctors : []).filter(
      (d) => d?.is_active !== false
    )
    return activeDoctors.map((d) => ({
      id: d.employee_id || `legacy-doctor-${d.id}`,
      full_name: d.full_name,
      role: 'doctor',
      is_active: true,
      legacy_doctor_id: d.id,
    }))
  } catch {
    return employees
  }
}

export const getStaffEngagementReport = async () => {
  const clinicId = await getCurrentClinicId()
  if (!clinicId) {
    return { rows: [], inactive: [], clinicId: null }
  }

  const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000)

  const [allEmployees, logs, rpcRows] = await Promise.all([
    getAllEmployees(),
    listActivityLogsSince({ since, limit: 5000 }).catch(() => []),
    fetchStaffEngagementRpc(clinicId, SINCE_DAYS),
  ])

  const employees = await resolveTrackedStaff(clinicId, allEmployees)

  let statsMap = aggregateLogsForEmployees(logs, employees)
  statsMap = mergeRpcStats(statsMap, rpcRows)

  const rows = buildStaffEngagementRows(employees, statsMap)
  const inactive = filterInactiveStaff(rows)

  return {
    clinicId,
    rows,
    inactive,
    since: since.toISOString(),
  }
}
