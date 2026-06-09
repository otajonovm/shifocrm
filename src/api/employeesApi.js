import {
  supabaseGet,
  supabasePost,
  supabasePatch,
  supabasePatchWhere,
  supabaseDelete,
  supabaseDeleteWhere,
} from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { hydrateEmployee } from '@/lib/staffHelpers'

const EMPLOYEES_TABLE = 'employees'
const PERMISSIONS_TABLE = 'employee_permissions'
const SCHEDULES_TABLE = 'doctor_schedules'
const LOGS_TABLE = 'activity_logs'

const NESTED_SELECT = encodeURIComponent('*,employee_permissions(*),doctor_schedules(*)')

const stripPassword = (row) => {
  if (!row || typeof row !== 'object') return row
  const { password: _password, ...safe } = row
  return safe
}

const stripUndefined = (payload) => {
  const cleaned = { ...payload }
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key]
  })
  return cleaned
}

async function rollbackEmployee(employeeId) {
  if (!employeeId) return
  try {
    await supabaseDeleteWhere(SCHEDULES_TABLE, `doctor_id=eq.${employeeId}`)
  } catch (e) {
    console.warn('⚠️ Rollback schedules:', e?.message)
  }
  try {
    await supabaseDeleteWhere(PERMISSIONS_TABLE, `employee_id=eq.${employeeId}`)
  } catch (e) {
    console.warn('⚠️ Rollback permissions:', e?.message)
  }
  try {
    await supabaseDelete(EMPLOYEES_TABLE, employeeId)
  } catch (e) {
    console.error('⚠️ Rollback employee failed:', e)
    throw e
  }
}

function buildEmployeesQuery(suffix = '') {
  return `select=${NESTED_SELECT}${suffix ? `&${suffix}` : ''}`
}

export const getAllEmployees = async () => {
  const cid = await getCurrentClinicId()
  let query = buildEmployeesQuery('order=created_at.desc')
  if (cid != null && Number.isFinite(Number(cid))) {
    query += `&clinic_id=eq.${Number(cid)}`
  }

  let rows = await supabaseGet(EMPLOYEES_TABLE, query)

  // clinic_id bo'sh migratsiya qilingan yozuvlar uchun fallback
  if (
    cid != null
    && Number.isFinite(Number(cid))
    && (!Array.isArray(rows) || rows.length === 0)
  ) {
    const fallbackQuery = buildEmployeesQuery('order=created_at.desc')
    rows = await supabaseGet(EMPLOYEES_TABLE, fallbackQuery)
    rows = (Array.isArray(rows) ? rows : []).filter(
      (row) => row.clinic_id == null || Number(row.clinic_id) === Number(cid)
    )
  }

  return (Array.isArray(rows) ? rows : []).map((row) => hydrateEmployee(stripPassword(row)))
}

export const getEmployeeById = async (employeeId) => {
  if (!employeeId) return null
  const query = buildEmployeesQuery(`id=eq.${employeeId}`)
  const rows = await supabaseGet(EMPLOYEES_TABLE, query)
  const row = rows?.[0]
  return row ? hydrateEmployee(stripPassword(row)) : null
}

export const createEmployee = async (employeeData, permissionsData, scheduleData) => {
  let createdEmployeeId = null

  try {
    const now = new Date().toISOString()
    const payload = stripUndefined({ ...employeeData })
    if (payload.created_at === undefined) payload.created_at = now
    if (payload.updated_at === undefined) payload.updated_at = now

    const result = await supabasePost(EMPLOYEES_TABLE, payload)
    const created = result?.[0]
    if (!created) throw new Error('Xodim yaratishda javob olinmadi')

    createdEmployeeId = created.id

    if (permissionsData) {
      const permissionsPayload = stripUndefined({
        ...permissionsData,
        updated_at: now,
      })
      await supabasePatchWhere(
        PERMISSIONS_TABLE,
        `employee_id=eq.${createdEmployeeId}`,
        permissionsPayload
      )
    }

    const schedules = Array.isArray(scheduleData)
      ? scheduleData
      : (scheduleData ? [scheduleData] : [])

    if (schedules.length > 0) {
      const schedulesPayload = schedules.map((entry) => {
        const normalized = stripUndefined({ ...entry })
        return {
          ...normalized,
          doctor_id: createdEmployeeId,
          created_at: normalized.created_at ?? now,
          updated_at: normalized.updated_at ?? now,
        }
      })
      await supabasePost(SCHEDULES_TABLE, schedulesPayload)
    }

    const full = await getEmployeeById(createdEmployeeId)
    return full ?? hydrateEmployee(stripPassword(created))
  } catch (error) {
    if (createdEmployeeId) {
      try {
        await rollbackEmployee(createdEmployeeId)
      } catch (rollbackError) {
        console.error('⚠️ Rollback failed:', rollbackError)
        throw new Error(
          error?.message
            ? `${error.message} (va qisman yaratilgan yozuvni tozalab bo'lmadi)`
            : 'Xodim yaratishda xatolik va rollback muvaffaqiyatsiz'
        )
      }
    }
    throw error
  }
}

export const updateEmployee = async (employeeId, updatedData) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  const payload = stripUndefined({
    ...updatedData,
    updated_at: new Date().toISOString(),
  })

  const result = await supabasePatch(EMPLOYEES_TABLE, employeeId, payload)
  const row = result?.[0] || null
  return row ? hydrateEmployee(stripPassword(row)) : null
}

export const replaceEmployeeSchedules = async (employeeId, scheduleData) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  await supabaseDeleteWhere(SCHEDULES_TABLE, `doctor_id=eq.${employeeId}`)

  const schedules = Array.isArray(scheduleData) ? scheduleData : []
  if (!schedules.length) return []

  const now = new Date().toISOString()
  const payload = schedules.map((entry) => ({
    ...stripUndefined({ ...entry }),
    doctor_id: employeeId,
    created_at: now,
    updated_at: now,
  }))

  return await supabasePost(SCHEDULES_TABLE, payload)
}

export const updateEmployeePermissions = async (employeeId, permissions) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  const { module_permissions, ...scalarPerms } = permissions || {}
  const payload = stripUndefined({
    ...scalarPerms,
    ...(module_permissions !== undefined ? { module_permissions } : {}),
    updated_at: new Date().toISOString(),
  })

  const result = await supabasePatchWhere(
    PERMISSIONS_TABLE,
    `employee_id=eq.${employeeId}`,
    payload
  )

  return result?.[0] || null
}

export const deleteEmployee = async (employeeId) => {
  if (!employeeId) throw new Error('Xodim id majburiy')
  await supabaseDelete(EMPLOYEES_TABLE, employeeId)
  return { id: employeeId }
}

export const logEmployeeActivity = async (employeeId, action, details = {}) => {
  if (!action) throw new Error('Action is required')

  const payload = {
    employee_id: employeeId || null,
    action,
    details: details || {},
    created_at: new Date().toISOString(),
  }

  const result = await supabasePost(LOGS_TABLE, payload)
  return result?.[0] || null
}
