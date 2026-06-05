/**
 * Tenant isolation: joriy klinika id.
 * Clinic admin → userClinicId; Doctor → user.clinic_id; Global admin → default clinic.
 * Super admin → null (faqat /admin, operatsion ma'lumot yo'q).
 * Klinikadagi super admin → clinic admin kabi.
 */

import { getDefaultClinicId } from '@/services/adminService'

const USER_CLINIC_KEY = 'userClinicId'
const USER_ROLE_KEY = 'userRole'
const USER_KEY = 'user'
const SUPER_ADMIN_SCOPE_KEY = 'superAdminScope'

/**
 * @returns {Promise<number|null>}
 */
export async function getCurrentClinicId() {
  const role = localStorage.getItem(USER_ROLE_KEY) || ''
  const superAdminScope = localStorage.getItem(SUPER_ADMIN_SCOPE_KEY) || ''
  if (role === 'super_admin' && superAdminScope !== 'clinic') return null

  const stored = localStorage.getItem(USER_CLINIC_KEY)
  if (stored != null && stored !== '') {
    const n = Number(stored)
    if (Number.isFinite(n)) return n
  }

  const raw = localStorage.getItem(USER_KEY)
  let user = null
  try {
    user = raw ? JSON.parse(raw) : null
  } catch {
    user = null
  }
  const cid = user?.clinic_id
  if (cid != null && Number.isFinite(Number(cid))) return Number(cid)

  if (role === 'admin' || role === 'doctor' || role === 'solo' || (role === 'super_admin' && superAdminScope === 'clinic')) {
    const defaultId = await getDefaultClinicId()
    return defaultId
  }
  return null
}
