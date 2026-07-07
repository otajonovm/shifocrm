/**
 * Xodimlar tizim faolligi — agregatsiya yordamchilari.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const TRACKED_STAFF_ROLES = new Set(['doctor', 'administrator'])

export const INACTIVE_THRESHOLD_DAYS = 2

const PATIENT_VIEW_ACTION = 'patient.view'
const PATIENT_UPDATE_ACTION = 'patient.update'

const isTodayInTashkent = (isoString) => {
  if (!isoString) return false
  const d = new Date(isoString)
  const now = new Date()
  const fmt = (date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' })
  return fmt(d) === fmt(now)
}

export const computeDaysInactive = (lastActivityAt) => {
  if (!lastActivityAt) return null
  const diff = Date.now() - new Date(lastActivityAt).getTime()
  return Math.max(0, Math.floor(diff / MS_PER_DAY))
}

export const isStaffInactive = (daysInactive, threshold = INACTIVE_THRESHOLD_DAYS) => {
  if (daysInactive === null) return true
  return daysInactive >= threshold
}

const normalizeName = (name) => String(name || '').trim().toLowerCase()

export const aggregateLogsForEmployees = (logs = [], employees = []) => {
  const byEmployeeId = new Map()
  const byName = new Map()

  for (const emp of employees) {
    const base = {
      lastActivityAt: null,
      patientViewsToday: 0,
      patientUpdatesToday: 0,
      totalActions: 0,
    }
    byEmployeeId.set(emp.id, { ...base })
    if (emp.full_name) {
      byName.set(normalizeName(emp.full_name), emp.id)
    }
  }

  for (const log of logs) {
    let employeeId = log.employee_id || null

    if (!employeeId && log.details?.actor_name) {
      employeeId = byName.get(normalizeName(log.details.actor_name)) || null
    }

    if (!employeeId || !byEmployeeId.has(employeeId)) continue

    const stats = byEmployeeId.get(employeeId)
    const createdAt = log.created_at

    if (!stats.lastActivityAt || new Date(createdAt) > new Date(stats.lastActivityAt)) {
      stats.lastActivityAt = createdAt
    }

    stats.totalActions += 1

    if (log.action === PATIENT_VIEW_ACTION && isTodayInTashkent(createdAt)) {
      stats.patientViewsToday += 1
    }
    if (log.action === PATIENT_UPDATE_ACTION && isTodayInTashkent(createdAt)) {
      stats.patientUpdatesToday += 1
    }
  }

  return byEmployeeId
}

export const mergeRpcStats = (byEmployeeId, rpcRows = []) => {
  for (const row of rpcRows) {
    if (!row?.employee_id || !byEmployeeId.has(row.employee_id)) continue
    const stats = byEmployeeId.get(row.employee_id)

    if (row.last_activity_at) {
      if (!stats.lastActivityAt || new Date(row.last_activity_at) > new Date(stats.lastActivityAt)) {
        stats.lastActivityAt = row.last_activity_at
      }
    }

    const viewsToday = Number(row.patient_views_today) || 0
    const updatesToday = Number(row.patient_updates_today) || 0
    if (viewsToday > stats.patientViewsToday) stats.patientViewsToday = viewsToday
    if (updatesToday > stats.patientUpdatesToday) stats.patientUpdatesToday = updatesToday

    const total = Number(row.total_actions) || 0
    if (total > stats.totalActions) stats.totalActions = total
  }
  return byEmployeeId
}

export const buildStaffEngagementRows = (employees = [], statsByEmployeeId = new Map()) => {
  const rows = employees
    .filter((e) => e?.is_active !== false && TRACKED_STAFF_ROLES.has(String(e.role || '').toLowerCase()))
    .map((emp) => {
      const stats = statsByEmployeeId.get(emp.id) || {
        lastActivityAt: null,
        patientViewsToday: 0,
        patientUpdatesToday: 0,
        totalActions: 0,
      }
      const daysInactive = computeDaysInactive(stats.lastActivityAt)

      return {
        employeeId: emp.id,
        fullName: emp.full_name || '—',
        role: emp.role,
        lastActivityAt: stats.lastActivityAt,
        patientViewsToday: stats.patientViewsToday,
        patientUpdatesToday: stats.patientUpdatesToday,
        totalActions: stats.totalActions,
        daysInactive,
        isInactive: isStaffInactive(daysInactive),
      }
    })

  rows.sort((a, b) => {
    if (a.isInactive !== b.isInactive) return a.isInactive ? -1 : 1
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
    return bTime - aTime
  })

  return rows
}

export const filterInactiveStaff = (rows = []) =>
  rows.filter((row) => row.isInactive)
