/**
 * Foydalanuvchi boshqaruvi (profiles) — Service Layer.
 * @module services/userManagementService
 */

import {
  supabaseGet,
  supabasePatch,
  supabasePatchWhere,
  supabaseDeleteWhere,
} from '@/api/supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { formatPhoneForStorage } from '@/lib/phoneUz'

const TABLE = 'profiles'

const PROFILE_SELECT =
  'id,user_id,account_type,member_role,role,full_name,phone,email,is_active,clinic_id,created_at,updated_at'

const toResult = (data = null, error = null) => ({ data, error })

const normalizeProfile = (row) => {
  if (!row || typeof row !== 'object') return null
  return {
    id: row.id,
    userId: row.user_id || null,
    accountType: row.account_type || 'individual',
    memberRole: row.member_role || null,
    role: row.role || null,
    fullName: row.full_name || '',
    phone: row.phone || '',
    email: row.email || '',
    isActive: row.is_active !== false,
    clinicId: row.clinic_id != null ? Number(row.clinic_id) : null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

/**
 * @param {{ clinicId?: number|null, includeInactive?: boolean }} [options]
 */
export async function listManagedUsers({ clinicId = null, includeInactive = true } = {}) {
  try {
    let query = `select=${PROFILE_SELECT}&order=full_name.asc.nullslast,created_at.desc`

    const scopedClinicId = clinicId ?? (await getCurrentClinicId())
    if (scopedClinicId != null && Number.isFinite(Number(scopedClinicId))) {
      query += `&clinic_id=eq.${Number(scopedClinicId)}`
    }

    if (!includeInactive) {
      query += '&is_active=eq.true'
    }

    const rows = await supabaseGet(TABLE, query)
    return toResult((Array.isArray(rows) ? rows : []).map(normalizeProfile), null)
  } catch (error) {
    return toResult(null, {
      code: 'LIST_USERS_FAILED',
      message: error?.message || 'Foydalanuvchilar ro\'yxati yuklanmadi',
    })
  }
}

/**
 * @param {number|string} profileId
 * @param {{ fullName?: string, phone?: string, isActive?: boolean }} patch
 */
export async function updateManagedUser(profileId, { fullName, phone, isActive } = {}) {
  const id = Number(profileId)
  if (!Number.isFinite(id)) {
    return toResult(null, { code: 'INVALID_ID', message: 'Profil ID noto\'g\'ri' })
  }

  const payload = {}
  if (fullName !== undefined) payload.full_name = String(fullName || '').trim() || null
  if (phone !== undefined) {
    const normalized = formatPhoneForStorage(phone) || String(phone || '').trim() || null
    payload.phone = normalized
  }
  if (typeof isActive === 'boolean') payload.is_active = isActive

  if (!Object.keys(payload).length) {
    return toResult(null, { code: 'EMPTY_PATCH', message: 'Yangilash uchun ma\'lumot yo\'q' })
  }

  try {
    const rows = await supabasePatch(TABLE, id, payload)
    const row = Array.isArray(rows) ? rows[0] : rows
    return toResult(normalizeProfile(row), null)
  } catch (error) {
    return toResult(null, {
      code: 'UPDATE_USER_FAILED',
      message: error?.message || 'Foydalanuvchi yangilanmadi',
    })
  }
}

/**
 * Profilni o'chirish (auth.users CASCADE bilan user_id bog'langan bo'lsa auth ham o'chadi).
 * @param {number|string} profileId
 */
export async function deleteManagedUser(profileId) {
  const id = Number(profileId)
  if (!Number.isFinite(id)) {
    return toResult(null, { code: 'INVALID_ID', message: 'Profil ID noto\'g\'ri' })
  }

  try {
    await supabaseDeleteWhere(TABLE, `id=eq.${id}`)
    return toResult({ id }, null)
  } catch (error) {
    return toResult(null, {
      code: 'DELETE_USER_FAILED',
      message: error?.message || 'Foydalanuvchi o\'chirilmadi',
    })
  }
}

/**
 * UUID orqali profilni deaktivatsiya (soft delete).
 * @param {string} userId
 */
export async function deactivateUserByAuthId(userId) {
  if (!userId) {
    return toResult(null, { code: 'INVALID_USER_ID', message: 'user_id majburiy' })
  }
  try {
    await supabasePatchWhere(TABLE, `user_id=eq.${encodeURIComponent(userId)}`, {
      is_active: false,
    })
    return toResult({ userId, isActive: false }, null)
  } catch (error) {
    return toResult(null, {
      code: 'DEACTIVATE_FAILED',
      message: error?.message || 'Foydalanuvchi o\'chirilmadi',
    })
  }
}
