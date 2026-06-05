import {
  supabaseGet,
  supabasePost,
  supabasePatch,
  supabasePatchWhere,
  supabaseDelete
} from './supabaseConfig'
import { useToast } from '@/composables/useToast'

const EMPLOYEES_TABLE = 'employees'
const PERMISSIONS_TABLE = 'employee_permissions'
const SCHEDULES_TABLE = 'doctor_schedules'
const LOGS_TABLE = 'activity_logs'

const notifyError = (label, error) => {
  console.error(`❌ ${label}:`, error)
  const toast = useToast()
  toast.error(error?.message || 'Unexpected error')
}

const stripUndefined = (payload) => {
  const cleaned = { ...payload }
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key]
  })
  return cleaned
}

export const getAllEmployees = async () => {
  try {
    const select = encodeURIComponent('*,employee_permissions(*),doctor_schedules(*)')
    const query = `select=${select}&order=created_at.desc`
    return await supabaseGet(EMPLOYEES_TABLE, query)
  } catch (error) {
    notifyError('Failed to fetch employees', error)
    throw error
  }
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

    if (!created) throw new Error('Employee create returned no data')

    createdEmployeeId = created.id

    if (permissionsData) {
      const permissionsPayload = stripUndefined({
        ...permissionsData,
        updated_at: now
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
          updated_at: normalized.updated_at ?? now
        }
      })

      await supabasePost(SCHEDULES_TABLE, schedulesPayload)
    }

    return created
  } catch (error) {
    if (createdEmployeeId) {
      try {
        await supabaseDelete(EMPLOYEES_TABLE, createdEmployeeId)
      } catch (rollbackError) {
        console.error('⚠️ Rollback failed:', rollbackError)
      }
    }

    notifyError('Failed to create employee', error)
    throw error
  }
}

export const updateEmployee = async (employeeId, updatedData) => {
  try {
    if (!employeeId) throw new Error('Employee id is required')

    const payload = stripUndefined({
      ...updatedData,
      updated_at: new Date().toISOString()
    })

    const result = await supabasePatch(EMPLOYEES_TABLE, employeeId, payload)
    return result?.[0] || null
  } catch (error) {
    notifyError('Failed to update employee', error)
    throw error
  }
}

export const updateEmployeePermissions = async (employeeId, permissions) => {
  try {
    if (!employeeId) throw new Error('Employee id is required')

    const payload = stripUndefined({
      ...permissions,
      updated_at: new Date().toISOString()
    })

    const result = await supabasePatchWhere(
      PERMISSIONS_TABLE,
      `employee_id=eq.${employeeId}`,
      payload
    )

    return result?.[0] || null
  } catch (error) {
    notifyError('Failed to update employee permissions', error)
    throw error
  }
}

export const logEmployeeActivity = async (employeeId, action, details = {}) => {
  try {
    if (!action) throw new Error('Action is required')

    const payload = {
      employee_id: employeeId || null,
      action,
      details: details || {},
      created_at: new Date().toISOString()
    }

    const result = await supabasePost(LOGS_TABLE, payload)
    return result?.[0] || null
  } catch (error) {
    notifyError('Failed to log employee activity', error)
    throw error
  }
}
