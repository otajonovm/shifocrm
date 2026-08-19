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
function sanitizeEnvValue(value) {
  if (value == null) return undefined
  let text = String(value).replace(/^\uFEFF/, '').trim()
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim()
  }
  text = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
  return text || undefined
}

function getEnv(key) {
  let raw
  if (typeof globalThis.Deno !== 'undefined' && typeof globalThis.Deno.env?.get === 'function') {
    raw = globalThis.Deno.env.get(key)
  } else if (typeof process !== 'undefined' && process.env) {
    raw = process.env[key]
  }
  return sanitizeEnvValue(raw)
}

function formatTextUpAuthError(body, status) {
  const raw = body?.message || body?.error || `TextUp auth HTTP ${status}`
  if (/additional_fields|validation failed/i.test(String(raw))) {
    return 'TextUp login rad etildi. .env dagi TEXTUP_EMAIL va TEXTUP_PASSWORD ni TextUp kabinetidagi login/parol bilan solishtiring.'
  }
  return raw
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

  if (/failed to get contacts from auth service|additional_fields|unauthorized/i.test(text)) {
    return 'TextUp hisobini tasdiqlay olmadi. .env dagi TEXTUP_EMAIL va TEXTUP_PASSWORD ni https://textup.uz kabinetidagi login/parol bilan solishtiring. Parolda @, #, $ bo\'lsa, qiymatni qo\'shtirnoqqa oling: TEXTUP_PASSWORD="parol".'
  }

  if (/template .*not found|template validation failed|failed to check template|failed to get template/i.test(text)) {
    return 'TextUp SMS shabloni hali tasdiqlanmagan. https://textup.uz/user/send-sms sahifasida shablon holati "Tekshiruvda" — moderator tasdiqlagach qayta yuboring.'
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
    const loginBodies = [
      { email, password },
      { email, password, rememberMe: false },
    ]

    let body = {}
    let response = null

    for (const loginBody of loginBodies) {
      response = await fetch(TEXTUP_AUTH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginBody),
      })
      body = await response.json().catch(() => ({}))
      if (response.ok) break
    }

    if (!response?.ok) {
      const error = formatTextUpAuthError(body, response?.status)
      console.error('[TextUp] Auth xatosi:', error)
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

function buildSendPayload(message, recipients, options = {}) {
  const templateId = options.templateId || getEnv('TEXTUP_TEMPLATE_ID') || null
  const nicknameId = options.nicknameId || getEnv('TEXTUP_NICKNAME_ID') || null
  const userId = options.userId || getEnv('TEXTUP_USER_ID') || null
  const isOtp = options.isOtp === true
  const includeName = options.includeName === true

  const payload = {
    message,
    recipients,
  }
  if (includeName) {
    const name = options.name || getEnv('TEXTUP_SEND_NAME') || DEFAULT_SEND_NAME
    if (name) payload.name = name
  }
  if (templateId && options.includeTemplate !== false) payload.templateId = templateId
  if (nicknameId) payload.nicknameId = nicknameId
  if (userId) payload.userId = userId
  payload.isOtp = isOtp === true
  return payload
}

function extractExpectedPattern(data, error) {
  const raw = [
    data?.error_message,
    data?.error,
    data?.message,
    error,
  ].filter(Boolean).join('\n')
  const match = String(raw).match(/Expected pattern:\s*(.+)$/im)
  return match ? match[1].trim() : null
}

function textUpErrorText(data, status) {
  return data?.error_message || data?.message || data?.error || `TextUp SMS HTTP ${status}`
}

async function postTextUpSend(recipients, message, options = {}) {
  const email = getEnv('TEXTUP_EMAIL')
  const password = getEnv('TEXTUP_PASSWORD')
  const accessToken = options.accessToken || null
  if (!accessToken && (!email || !password)) {
    return { success: false, error: 'TEXTUP_EMAIL va TEXTUP_PASSWORD .env da ko\'rsatilishi kerak.' }
  }

  const payload = buildSendPayload(message, recipients, options)
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (email && password) {
    headers['X-Email'] = email
    headers['X-Password'] = password
  }

  const response = await fetch(TEXTUP_SEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = formatTextUpSendError(textUpErrorText(data, response.status), payload.templateId || null)
    console.error('[TextUp] send xato:', response.status, error)
    return { success: false, error, data, status: response.status }
  }
  console.log('[TextUp] SMS muvaffaqiyatli yuborildi:', recipients.join(', '))
  return { success: true, data }
}

async function sendViaAuthenticatedSession(recipients, message, options = {}) {
  const auth = await getTextUpAuth()
  if (!auth.success) return auth

  const isOtp = options.isOtp === true
  const attempts = [
    { ...options, isOtp, userId: auth.userId, accessToken: auth.accessToken },
  ]

  let last = { success: false, error: 'SMS yuborilmadi' }
  let messageToSend = message
  for (let i = 0; i < 2; i += 1) {
    try {
      last = await postTextUpSend(recipients, messageToSend, attempts[0])
      if (last.success) return last
      if (last.status === 401 || /failed to get contacts|hisobini tasdiqlay olmadi/i.test(last.error || '')) {
        clearTextUpAuthCache()
        return last
      }
      const expected = extractExpectedPattern(last.data, last.error)
      if (expected && expected !== messageToSend) {
        console.warn('[TextUp] shablon matniga moslab qayta yuboriladi')
        messageToSend = expected
        continue
      }
      return last
    } catch (err) {
      last = { success: false, error: err?.message || 'TextUp SMS ulanishi xatosi' }
    }
  }
  return last
}

/**
 * Explicit recipients orqali SMS yuborish (TextUp).
 * Avval JWT Bearer, kerak bo'lsa X-Email/X-Password.
 * @param {string|string[]} phoneNumbers — bitta raqam yoki massiv (+998... yoki 90...)
 * @param {string} text — SMS matni
 * @param {{ name?: string, templateId?: string, isOtp?: boolean, nicknameId?: string }} [options]
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

  const templateId = options.templateId || getEnv('TEXTUP_TEMPLATE_ID') || null

  try {
    const headerResult = await sendViaAuthenticatedSession(recipients, message, { ...options, templateId })
    if (headerResult.success) {
      return headerResult
    }
    console.warn('[TextUp] header orqali yuborilmadi:', headerResult.error)
    return headerResult
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
