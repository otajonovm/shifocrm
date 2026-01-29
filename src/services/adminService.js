/**
 * Super Admin service: clinic CRUD and global actions.
 * Only super_admin may use these. Used by /admin UI.
 * @module services/adminService
 */

import { supabaseGet, supabasePost, supabasePatch } from '@/api/supabaseConfig'

const CLINICS_TABLE = 'clinics'
const DOCTORS_TABLE = 'doctors'
const CLINIC_ADMINS_TABLE = 'clinic_admins'

/**
 * List all clinics.
 * @returns {Promise<import('@/types/super-admin').Clinic[]>}
 */
export async function listClinics() {
  const rows = await supabaseGet(CLINICS_TABLE, 'order=created_at.desc')
  return Array.isArray(rows) ? rows : []
}

/**
 * Get one clinic by id.
 * @param {number} id
 * @returns {Promise<import('@/types/super-admin').Clinic|null>}
 */
export async function getClinic(id) {
  const numId = Number(id)
  if (!Number.isFinite(numId)) return null
  const rows = await supabaseGet(CLINICS_TABLE, `id=eq.${numId}`)
  return rows && rows[0] ? rows[0] : null
}

/** 409 Conflict — slug takrorlangan. */
export const CLINIC_SLUG_CONFLICT =
  "Bunday slug (subdomen) allaqachon mavjud. Boshqa slug kiriting, masalan: klinika-2, filial-toshkent."

/**
 * Create a clinic.
 * @param {import('@/types/super-admin').ClinicCreateInput} data
 * @returns {Promise<import('@/types/super-admin').Clinic>}
 */
export async function createClinic(data) {
  const payload = {
    name: data.name,
    slug: (data.slug || '').trim().toLowerCase().replace(/\s+/g, '-') || 'default',
    logo_url: data.logo_url || null,
    max_doctors: Math.max(1, Number(data.max_doctors) || 4),
    is_active: data.is_active !== false
  }
  try {
    const result = await supabasePost(CLINICS_TABLE, payload)
    return result && result[0] ? result[0] : result
  } catch (e) {
    const st = /** @type {*} */ (e).status
    const code = /** @type {*} */ (e).code
    const msg = (e?.message || '').toLowerCase()
    if (Number(st) === 409 || code === '23505' || /duplicate|unique|23505/.test(msg)) {
      throw new Error(CLINIC_SLUG_CONFLICT)
    }
    throw e
  }
}

/**
 * Update a clinic.
 * @param {number} id
 * @param {import('@/types/super-admin').ClinicUpdateInput} data
 * @returns {Promise<import('@/types/super-admin').Clinic>}
 */
export async function updateClinic(id, data) {
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid clinic id')
  const payload = { updated_at: new Date().toISOString() }
  if (data.name != null) payload.name = data.name
  if (data.slug != null) payload.slug = String(data.slug).trim().toLowerCase().replace(/\s+/g, '-')
  if (data.logo_url !== undefined) payload.logo_url = data.logo_url || null
  if (data.max_doctors != null) payload.max_doctors = Math.max(1, Number(data.max_doctors) || 4)
  if (typeof data.is_active === 'boolean') payload.is_active = data.is_active
  try {
    const result = await supabasePatch(CLINICS_TABLE, numId, payload)
    return result && result[0] ? result[0] : result
  } catch (e) {
    const st = /** @type {*} */ (e).status
    const code = /** @type {*} */ (e).code
    const msg = (e?.message || '').toLowerCase()
    if (Number(st) === 409 || code === '23505' || /duplicate|unique|23505/.test(msg)) {
      throw new Error(CLINIC_SLUG_CONFLICT)
    }
    throw e
  }
}

/**
 * Get doctor count for a clinic.
 * @param {number} clinicId
 * @returns {Promise<number>}
 */
export async function getDoctorCountByClinic(clinicId) {
  const numId = Number(clinicId)
  if (!Number.isFinite(numId)) return 0
  try {
    const rows = await supabaseGet(DOCTORS_TABLE, `clinic_id=eq.${numId}&select=id`)
    return Array.isArray(rows) ? rows.length : 0
  } catch {
    return 0
  }
}

/**
 * Suspend (deactivate) a clinic.
 * @param {number} id
 * @returns {Promise<import('@/types/super-admin').Clinic>}
 */
export async function suspendClinic(id) {
  return updateClinic(id, { is_active: false })
}

/** Error when doctor limit reached (use in doctorsApi / UI). */
export const MAX_DOCTORS_ERROR =
  "Sizning tarifingiz bo'yicha limit to'lgan (Max: 4). Iltimos, administratorga bog'laning."

/**
 * Default clinic id for single-tenant / current context (e.g. first active clinic).
 * @returns {Promise<number|null>}
 */
export async function getDefaultClinicId() {
  try {
    const list = await listClinics()
    const active = list.find((c) => c.is_active !== false)
    return active ? Number(active.id) : (list[0] ? Number(list[0].id) : null)
  } catch {
    return null
  }
}

/**
 * Assert clinic is under max_doctors before adding a doctor; throw if not.
 * @param {number} clinicId
 * @throws {Error} With MAX_DOCTORS_ERROR message when limit reached.
 */
export async function assertDoctorLimitNotReached(clinicId) {
  const clinic = await getClinic(clinicId)
  if (!clinic) throw new Error('Clinic not found')
  const count = await getDoctorCountByClinic(clinicId)
  const max = Math.max(1, Number(clinic.max_doctors) || 4)
  if (count >= max) {
    const err = new Error(MAX_DOCTORS_ERROR)
    err.code = 'MAX_DOCTORS_REACHED'
    err.max = max
    err.count = count
    throw err
  }
}

// -----------------------------------------------------------------------------
// Clinic admins (klinika admini login / parol)
// -----------------------------------------------------------------------------

/**
 * Authenticate clinic admin by login + password. Returns admin + clinic_id if clinic is active.
 * @param {string} login
 * @param {string} password
 * @returns {Promise<{ id: number, clinic_id: number, login: string }|null>}
 */
export async function authenticateClinicAdmin(login, password) {
  const l = (login || '').trim()
  const p = (password || '').trim()
  if (!l || !p) return null
  try {
    const rows = await supabaseGet(
      CLINIC_ADMINS_TABLE,
      `login=eq.${encodeURIComponent(l)}&password=eq.${encodeURIComponent(p)}`
    )
    const admin = Array.isArray(rows) && rows[0] ? rows[0] : null
    if (!admin) return null
    const clinic = await getClinic(admin.clinic_id)
    if (!clinic || clinic.is_active === false) return null
    return { id: admin.id, clinic_id: Number(admin.clinic_id), login: admin.login }
  } catch {
    return null
  }
}

/**
 * Get clinic admin(s) for a clinic. First one used as "primary" in UI.
 * @param {number} clinicId
 * @returns {Promise<{ id: number, clinic_id: number, login: string }|null>}
 */
export async function getClinicAdminByClinic(clinicId) {
  const id = Number(clinicId)
  if (!Number.isFinite(id)) return null
  try {
    const rows = await supabaseGet(CLINIC_ADMINS_TABLE, `clinic_id=eq.${id}&order=id.asc&limit=1`)
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch {
    return null
  }
}

/**
 * Create clinic admin (login + password for klinika admini).
 * @param {number} clinicId
 * @param {{ login: string, password: string }} data
 * @returns {Promise<{ id: number, clinic_id: number, login: string }>}
 */
export async function createClinicAdmin(clinicId, data) {
  const id = Number(clinicId)
  if (!Number.isFinite(id)) throw new Error('Invalid clinic id')
  const login = (data.login || '').trim()
  const password = (data.password || '').trim()
  if (!login || !password) throw new Error('Login va parol majburiy')
  const payload = {
    clinic_id: id,
    login,
    password
  }
  const result = await supabasePost(CLINIC_ADMINS_TABLE, payload)
  return result && result[0] ? result[0] : result
}

/**
 * Update clinic admin (login and/or password).
 * @param {number} adminId
 * @param {{ login?: string, password?: string }} data
 * @returns {Promise<{ id: number, clinic_id: number, login: string }>}
 */
export async function updateClinicAdmin(adminId, data) {
  const id = Number(adminId)
  if (!Number.isFinite(id)) throw new Error('Invalid admin id')
  const payload = { updated_at: new Date().toISOString() }
  if (data.login != null) payload.login = String(data.login).trim()
  if (data.password != null && String(data.password).trim()) payload.password = String(data.password).trim()
  if (Object.keys(payload).length <= 1) {
    const rows = await supabaseGet(CLINIC_ADMINS_TABLE, `id=eq.${id}`)
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  }
  const result = await supabasePatch(CLINIC_ADMINS_TABLE, id, payload)
  return result && result[0] ? result[0] : result
}
