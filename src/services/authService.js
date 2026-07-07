/**
 * authService — Supabase Auth qatlamini o'raydigan servis.
 *
 * Faza 0+1: individual (yakka doktor) self-service signup + login.
 * Mavjud custom login (clinic owner/admin/employee/doctor) bu servisga
 * TEGMAYDI — u alohida ishlaydi. Bu servis faqat Supabase Auth uchun.
 *
 * Service Layer qoidasi: komponentlar supabase clientni to'g'ridan-to'g'ri
 * chaqirmaydi, faqat shu servis orqali ishlaydi.
 *
 * @module services/authService
 */

import { getSupabaseClient } from '@/lib/supabaseClient'
import { createSoloDoctor } from '@/services/adminService'
import { supabaseGet, supabasePost } from '@/api/supabaseConfig'
import { formatPhoneForStorage, phoneAuthLookupVariants } from '@/lib/phoneUz'

export const ACCOUNT_TYPES = Object.freeze({
  INDIVIDUAL: 'individual',
  CLINIC_MEMBER: 'clinic_member',
})

/** Xatolarni bir xil ko'rinishga keltirish */
const toResult = (data = null, error = null) => ({ data, error })

export async function logAuditAction({ userId = null, action, userRole = null, metadata = null }) {
  if (!action) return toResult(null, { code: 'AUDIT_ACTION_REQUIRED', message: 'Audit action is required' })
  try {
    const payload = {
      user_id: userId != null ? String(userId) : null,
      action: String(action).trim().toLowerCase(),
      user_role: userRole ? String(userRole).trim().toLowerCase() : null,
      metadata: metadata && typeof metadata === 'object' ? metadata : null,
    }
    const rows = await supabasePost('audit_logs', payload)
    return toResult(rows?.[0] || null, null)
  } catch (error) {
    return toResult(null, {
      code: 'AUDIT_LOG_FAILED',
      message: error?.message || 'Audit log yozilmadi',
    })
  }
}

const mapAuthError = (error) => {
  if (!error) return null
  const msg = String(error.message || '').toLowerCase()
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return { code: 'EMAIL_TAKEN', message: 'Bu email allaqachon ro\'yxatdan o\'tgan' }
  }
  if (msg.includes('invalid login credentials')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Email yoki parol noto\'g\'ri' }
  }
  if (msg.includes('email not confirmed')) {
    return { code: 'EMAIL_NOT_CONFIRMED', message: 'Email tasdiqlanmagan. Pochtangizni tekshiring.' }
  }
  if (msg.includes('password')) {
    return { code: 'WEAK_PASSWORD', message: error.message }
  }
  return { code: 'AUTH_ERROR', message: error.message || 'Autentifikatsiya xatosi' }
}

/**
 * Telefon allaqachon doctors jadvalida bormi (shifokor login uchun).
 */
const isPhoneRegisteredAsDoctor = async (phone) => {
  const variants = phoneAuthLookupVariants(phone)
  for (const variant of variants) {
    const rows = await supabaseGet(
      'doctors',
      `phone=eq.${encodeURIComponent(variant)}&select=id&limit=1`
    ).catch(() => [])
    if (Array.isArray(rows) && rows.length > 0) return true
  }
  return false
}

/**
 * Yakka doktor (individual) ro'yxatdan o'tishi.
 * account_type metadata orqali yuboriladi -> handle_new_user() trigger profiles ga yozadi.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.fullName]
 * @param {string} [params.phone]
 * @param {number|string} [params.clinicId] — solo klinika (self-service signup)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signUpIndividual({
  email,
  password,
  fullName = '',
  phone = '',
  clinicId = null,
}) {
  const supabase = getSupabaseClient()
  const meta = {
    account_type: ACCOUNT_TYPES.INDIVIDUAL,
    full_name: String(fullName || '').trim(),
    phone: String(phone || '').trim(),
  }
  if (clinicId != null && Number.isFinite(Number(clinicId))) {
    meta.clinic_id = String(Number(clinicId))
  }

  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim(),
    password,
    options: { data: meta },
  })

  if (error) return toResult(null, mapAuthError(error))
  return toResult(data, null)
}

/**
 * Yakka stomatolog: solo klinika + doctors yozuvi + Supabase Auth.
 * Shifokor tab'dan telefon + parol bilan kirish uchun doctors jadvali to'ldiriladi.
 *
 * @returns {Promise<{data: { doctor, clinic, signUp }|null, error: object|null}>}
 */
export async function registerIndividualSoloDoctor({
  email,
  password,
  fullName = '',
  phone = '',
}) {
  const normalizedPhone = formatPhoneForStorage(phone) || String(phone || '').trim()
  if (!normalizedPhone || normalizedPhone.replace(/\D/g, '').length < 12) {
    return toResult(null, {
      code: 'PHONE_REQUIRED',
      message: 'Telefon raqami majburiy (+998...)',
    })
  }

  if (await isPhoneRegisteredAsDoctor(normalizedPhone)) {
    return toResult(null, {
      code: 'PHONE_TAKEN',
      message: 'Bu telefon allaqachon ro\'yxatdan o\'tgan. Shifokor bo\'limidan kiring.',
    })
  }

  const trimmedName = String(fullName || '').trim()
  const trimmedEmail = String(email || '').trim()
  const login = normalizedPhone.replace(/\D/g, '')

  let soloResult
  try {
    soloResult = await createSoloDoctor({
      full_name: trimmedName,
      email: trimmedEmail,
      password,
      login,
      phone: normalizedPhone,
      clinic_name: trimmedName || 'Yakka stomatolog',
    })
  } catch (err) {
    return toResult(null, {
      code: 'PROVISION_ERROR',
      message: err?.message || 'Klinika yaratilmadi',
    })
  }

  const clinicId = Number(soloResult?.clinic?.id)
  if (!Number.isFinite(clinicId)) {
    return toResult(null, {
      code: 'PROVISION_ERROR',
      message: 'Klinika yaratildi, lekin ID olinmadi',
    })
  }

  const { data: signUpData, error: signUpError } = await signUpIndividual({
    email: trimmedEmail,
    password,
    fullName: trimmedName,
    phone: normalizedPhone,
    clinicId,
  })

  if (signUpError) {
    return toResult(null, signUpError)
  }

  return toResult(
    {
      signUp: signUpData,
      clinic: soloResult.clinic,
      doctor: soloResult.doctor,
    },
    null
  )
}

/**
 * Email + parol bilan kirish (Supabase Auth).
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signInWithEmail({ email, password }) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password,
  })

  if (error) return toResult(null, mapAuthError(error))
  const authUser = data?.user || data?.session?.user
  await logAuditAction({
    userId: authUser?.id || null,
    action: 'login',
    userRole: authUser?.user_metadata?.role || authUser?.app_metadata?.role || 'individual',
    metadata: { source: 'supabase_auth' },
  })
  return toResult(data, null)
}

/** Chiqish (Supabase Auth sessiyasi). */
export async function signOut() {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const { error } = await supabase.auth.signOut()
  if (!error) {
    await logAuditAction({
      userId: user?.id || null,
      action: 'logout',
      userRole: user?.user_metadata?.role || user?.app_metadata?.role || 'individual',
      metadata: { source: 'supabase_auth' },
    })
  }
  return toResult(null, error ? mapAuthError(error) : null)
}

/** Joriy Supabase Auth sessiyasi (yoki null). */
export async function getSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()
  if (error) return toResult(null, mapAuthError(error))
  return toResult(data?.session || null, null)
}

/**
 * Joriy foydalanuvchining profiles yozuvi (account_type, clinic_id, role).
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getCurrentProfile() {
  const supabase = getSupabaseClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return toResult(null, mapAuthError(userErr))

  const userId = userData?.user?.id
  if (!userId) return toResult(null, null)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, account_type, clinic_id, member_role, role, full_name, phone, email, is_active')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return toResult(null, { code: 'PROFILE_ERROR', message: error.message })
  return toResult(data, null)
}

/**
 * Auth holati o'zgarganda callback (login/logout/refresh).
 * @param {(event: string, session: object|null) => void} callback
 * @returns {() => void} unsubscribe funksiyasi
 */
export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient()
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => data?.subscription?.unsubscribe?.()
}
