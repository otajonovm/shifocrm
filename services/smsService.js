/**
 * TextUp SMS xizmati — ShifoCRM backend (Node.js / Supabase Edge Functions).
 *
 * Muhit o'zgaruvchilari (.env):
 *   TEXTUP_EMAIL     — TextUp kabinet email
 *   TEXTUP_PASSWORD  — TextUp parol
 *   TEXTUP_USER_ID   — (ixtiyoriy) user UUID; bo'lmasa login javobidan olinadi
 *   TEXTUP_SEND_NAME — (ixtiyoriy) SMS kampaniya nomi, default: ShifoCRM
 *   TEXTUP_TEMPLATE_ID — (ixtiyoriy) default shablon UUID
 *
 * DIQQAT: Bu modul faqat server tomonda ishlatiladi (telegram-bot, Edge Function).
 * Frontend (visitsApi.js) ichiga import qilmang — API kalitlari ochiq bo'ladi.
 *
 * @module services/smsService
 */

const TEXTUP_AUTH_URL = 'https://api-auth.textup.uz/v1/login'
const TEXTUP_SEND_URL = 'https://sms-api.textup.uz/v1/send'
const TEXTUP_NICK_NAMES_URL = 'https://api-auth.textup.uz/v1/nick-names'
const TEXTUP_TEMPLATES_URL = 'https://api-auth.textup.uz/v1/templates'
const TEXTUP_GROUPS_URL = 'https://api-auth.textup.uz/v1/groups'
const TEXTUP_SMS_LIST_URL = 'https://sms-api.textup.uz/v1/sms'
const DEFAULT_SEND_NAME = 'ShifoCRM'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
const DEFAULT_TOKEN_TTL_MS = 55 * 60 * 1000

/** @type {{ accessToken: string|null, userId: string|null, expiresAt: number }} */
let authCache = {
  accessToken: null,
  userId: null,
  expiresAt: 0,
}

/**
 * Node.js (process.env) va Deno (Deno.env) uchun yagona env o'qish.
 * @param {string} key
 * @returns {string|undefined}
 */
function getEnv(key) {
  if (typeof globalThis.Deno !== 'undefined' && typeof globalThis.Deno.env?.get === 'function') {
    return globalThis.Deno.env.get(key)
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

/**
 * JWT ichidagi `exp` maydonidan amal qilish muddatini olish (ms).
 * @param {string} token
 * @returns {number|null}
 */
function parseJwtExpiryMs(token) {
  try {
    const segment = String(token || '').split('.')[1]
    if (!segment) return null

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

    let json
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(padded, 'base64').toString('utf8')
    } else if (typeof atob === 'function') {
      json = atob(padded)
    } else {
      return null
    }

    const payload = JSON.parse(json)
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function cacheAuth(accessToken, userId) {
  const now = Date.now()
  const expMs = parseJwtExpiryMs(accessToken)
  authCache = {
    accessToken,
    userId,
    expiresAt: expMs || (now + DEFAULT_TOKEN_TTL_MS),
  }
}

/**
 * TextUp shablon xatolarini tushunarli qilib qaytarish.
 * @param {string} rawError
 * @param {string|null} templateId
 */
function formatTextUpSendError(rawError, templateId) {
  const text = String(rawError || '')
  const patternMatch = text.match(/Expected pattern:\s*(.+)$/i)

  if (patternMatch) {
    const expected = patternMatch[1].trim()
    return [
      'SMS matni TextUp shabloniga mos emas.',
      `Kutilgan matn: "${expected}"`,
      templateId ? `Shablon ID: ${templateId}` : null,
      'Yechim: TextUp kabinetida yangi shablon ro\'yxatdan o\'tkazing yoki shu shablon matnini aynan yuboring.',
    ].filter(Boolean).join(' ')
  }

  if (/template validation failed/i.test(text) && !templateId) {
    return `${text}. Yechim: .env ga TEXTUP_TEMPLATE_ID qo\'ying.`
  }

  return text
}

/**
 * Keshlangan tokenni tozalash (test yoki 401 dan keyin).
 */
export function clearTextUpAuthCache() {
  authCache = { accessToken: null, userId: null, expiresAt: 0 }
}

/** @deprecated Eskiz nomi — TextUp uchun ham ishlaydi */
export const normalizePhoneForEskiz = normalizePhoneForTextUp

/**
 * Telefon raqamini TextUp formatiga keltirish: +998901234567
 * @param {string} phoneNumber
 * @returns {string}
 */
export function normalizePhoneForTextUp(phoneNumber) {
  let digits = String(phoneNumber || '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('998')) {
    digits = digits.slice(0, 12)
  } else if (digits.length === 9) {
    digits = `998${digits}`
  }

  return digits.startsWith('998') ? `+${digits}` : `+${digits}`
}

/**
 * TextUp ga login qilib accessToken va userId olish (kesh bilan).
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<{ success: true, accessToken: string, userId: string } | { success: false, error: string }>}
 */
export async function getTextUpAuth(forceRefresh = false) {
  const now = Date.now()
  const envUserId = String(getEnv('TEXTUP_USER_ID') || '').trim()

  if (
    !forceRefresh
    && authCache.accessToken
    && authCache.userId
    && authCache.expiresAt > now + TOKEN_REFRESH_BUFFER_MS
  ) {
    return {
      success: true,
      accessToken: authCache.accessToken,
      userId: envUserId || authCache.userId,
    }
  }

  const email = getEnv('TEXTUP_EMAIL')
  const password = getEnv('TEXTUP_PASSWORD')

  if (!email || !password) {
    const error = 'TEXTUP_EMAIL va TEXTUP_PASSWORD .env da ko\'rsatilishi kerak.'
    console.error(`[TextUp] ${error}`)
    return { success: false, error }
  }

  try {
    const response = await fetch(TEXTUP_AUTH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = body?.message || body?.error || `TextUp auth HTTP ${response.status}`
      console.error('[TextUp] Auth xatosi:', error, body)
      return { success: false, error }
    }

    const accessToken = body?.accessToken
    const userId = envUserId || body?.user?.id

    if (!accessToken) {
      const error = 'TextUp javobida accessToken topilmadi'
      console.error('[TextUp] Auth xatosi:', error, body)
      return { success: false, error }
    }

    if (!userId) {
      const error = 'TextUp javobida user.id topilmadi. TEXTUP_USER_ID ni .env ga qo\'ying.'
      console.error('[TextUp] Auth xatosi:', error, body)
      return { success: false, error }
    }

    cacheAuth(accessToken, userId)
    return { success: true, accessToken, userId }
  } catch (err) {
    const error = err?.message || 'TextUp auth ulanishi xatosi'
    console.error('[TextUp] Auth ulanish xatosi:', error)
    return { success: false, error }
  }
}

/**
 * TextUp API uchun umumiy GET so'rov.
 * @param {string} url
 * @param {{ page?: number, limit?: number, userId?: string }} [query]
 */
async function textUpGet(url, query = {}) {
  const auth = await getTextUpAuth()
  if (!auth.success) return auth

  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.limit != null) params.set('limit', String(query.limit))
  if (query.userId) params.set('userId', query.userId)

  const fullUrl = params.toString() ? `${url}?${params}` : url

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = data?.message || data?.error || `TextUp HTTP ${response.status}`
      return { success: false, error, data }
    }

    return { success: true, data }
  } catch (err) {
    const error = err?.message || 'TextUp GET ulanishi xatosi'
    return { success: false, error }
  }
}

/** Alpha names ro'yxati */
export async function getTextUpNickNames({ page = 1, limit = 20 } = {}) {
  const auth = await getTextUpAuth()
  if (!auth.success) return auth
  return textUpGet(TEXTUP_NICK_NAMES_URL, { page, limit, userId: auth.userId })
}

/** Shablonlar ro'yxati */
export async function getTextUpTemplates({ page = 1, limit = 20 } = {}) {
  const auth = await getTextUpAuth()
  if (!auth.success) return auth
  return textUpGet(TEXTUP_TEMPLATES_URL, { page, limit, userId: auth.userId })
}

/** Guruhlar ro'yxati */
export async function getTextUpGroups() {
  return textUpGet(TEXTUP_GROUPS_URL)
}

/** Yuborilgan SMSlar ro'yxati */
export async function getTextUpSmsList({ page = 1, limit = 20 } = {}) {
  const auth = await getTextUpAuth()
  if (!auth.success) return auth
  return textUpGet(TEXTUP_SMS_LIST_URL, { page, limit, userId: auth.userId })
}

/**
 * Explicit recipients orqali SMS yuborish (TextUp).
 * @param {string|string[]} phoneNumbers — bitta raqam yoki massiv (+998... yoki 90...)
 * @param {string} text — SMS matni
 * @param {{ name?: string, templateId?: string }} [options]
 * @returns {Promise<{ success: true, data: object } | { success: false, error: string, data?: object }>}
 */
export async function sendSMS(phoneNumbers, text, options = {}) {
  const rawList = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers]
  const recipients = rawList
    .map((phone) => normalizePhoneForTextUp(phone))
    .filter((phone) => phone.length >= 13)

  if (!recipients.length) {
    const error = 'Telefon raqami noto\'g\'ri. Kutilgan format: +998XXXXXXXXX'
    console.error('[TextUp] SMS validatsiya:', error, { phoneNumbers })
    return { success: false, error }
  }

  const message = String(text || '').trim()
  if (!message) {
    const error = 'SMS matni bo\'sh bo\'lishi mumkin emas'
    console.error('[TextUp] SMS validatsiya:', error)
    return { success: false, error }
  }

  const name = options.name || getEnv('TEXTUP_SEND_NAME') || DEFAULT_SEND_NAME
  const templateId = options.templateId || getEnv('TEXTUP_TEMPLATE_ID') || null

  const dispatch = async (accessToken, userId) => {
    const payload = {
      message,
      userId,
      name,
      recipients,
    }
    if (templateId) {
      payload.templateId = templateId
    }

    const response = await fetch(TEXTUP_SEND_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    return { response, data }
  }

  try {
    let auth = await getTextUpAuth()
    if (!auth.success) {
      return auth
    }

    let { response, data } = await dispatch(auth.accessToken, auth.userId)

    if (response.status === 401) {
      clearTextUpAuthCache()
      auth = await getTextUpAuth(true)
      if (!auth.success) {
        return auth
      }
      ;({ response, data } = await dispatch(auth.accessToken, auth.userId))
    }

    if (!response.ok) {
      const rawError = data?.message || data?.error || `TextUp SMS HTTP ${response.status}`
      const error = formatTextUpSendError(rawError, templateId)
      console.error('[TextUp] SMS yuborish xatosi:', error, { recipients, data })
      return { success: false, error, data }
    }

    console.log('[TextUp] SMS muvaffaqiyatli yuborildi:', recipients.join(', '))
    return { success: true, data }
  } catch (err) {
    const error = err?.message || 'SMS yuborishda kutilmagan xatolik'
    console.error('[TextUp] SMS ulanish xatosi:', error)
    return { success: false, error }
  }
}

/*
 * =============================================================================
 * ISHLATISH NAMUNALARI (faqat server — Node.js yoki Supabase Edge Function)
 * =============================================================================
 *
 * --- 1) Login va token olish ---
 *
 *   import { getTextUpAuth } from './services/smsService.js'
 *
 *   const auth = await getTextUpAuth()
 *   if (auth.success) {
 *     console.log('accessToken:', auth.accessToken)
 *     console.log('userId:', auth.userId)
 *   }
 *
 * --- 2) Bitta raqamga SMS ---
 *
 *   import { sendSMS } from './services/smsService.js'
 *
 *   const result = await sendSMS('+998901234567', 'Salom! Qabulingiz tasdiqlandi.')
 *
 * --- 3) Bir nechta raqamga (Explicit Recipients) ---
 *
 *   const result = await sendSMS(
 *     ['+998901234567', '998901112233'],
 *     'Ertaga soat 14:00 da qabulingiz bor.',
 *     { name: 'Qabul eslatmasi' }
 *   )
 *
 * Muhit: .env da TEXTUP_EMAIL + TEXTUP_PASSWORD (+ ixtiyoriy TEXTUP_USER_ID).
 */
