/**
 * Eskiz.uz SMS xizmati — ShifoCRM backend (Node.js / Supabase Edge Functions).
 *
 * Muhit o'zgaruvchilari (.env):
 *   ESKIZ_EMAIL     — Eskiz kabinet email (my.eskiz.uz)
 *   ESKIZ_PASSWORD  — SMS shlyuz paroli (my.eskiz.uz; login API uchun)
 *   ESKIZ_TOKEN     — (ixtiyoriy) tayyor JWT (eyJ...); odatda kerak emas — parol orqali avtomatik olinadi
 *   ESKIZ_FROM      — (ixtiyoriy) yuboruvchi nomi, default: 4546
 *
 * DIQQAT: Postman "PMAK-..." kaliti Eskiz tokeni EMAS — faqat Postman Cloud uchun.
 * Postmanda Eskiz login qilganda qaytadigan data.token (JWT) ni ESKIZ_TOKEN ga qo'ying.
 * DIQQAT: Bu modul faqat server tomonda ishlatiladi (telegram-bot, Edge Function).
 * Frontend (visitsApi.js) ichiga import qilmang — API kalitlari ochiq bo'ladi.
 *
 * @module services/smsService
 */

const ESKIZ_AUTH_URL = 'https://notify.eskiz.uz/api/auth/login'
const ESKIZ_SEND_URL = 'https://notify.eskiz.uz/api/message/sms/send'
const DEFAULT_SENDER = '4546'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
const DEFAULT_TOKEN_TTL_MS = 29 * 24 * 60 * 60 * 1000

/** @type {{ token: string|null, expiresAt: number }} */
let tokenCache = {
  token: null,
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

/** .env dagi to'g'ridan-to'g'ri JWT (Postman login javobidagi data.token). */
function getStaticEskizToken() {
  const raw = getEnv('ESKIZ_TOKEN') || getEnv('ESKIZ_API_TOKEN')
  const token = String(raw || '').trim()
  if (!token) return null

  if (token.startsWith('PMAK-')) {
    console.error(
      '[Eskiz] PMAK-... Postman API kalitidir, Eskiz tokeni emas. '
      + 'Postmanda notify.eskiz.uz/api/auth/login chaqirib data.token ni oling.'
    )
    return null
  }

  // Kabinetdagi shlyuz tokeni (JWT yoki opaque) — login API orqali emas, to'g'ridan-to'g'ri Bearer
  return token
}

function cacheToken(token) {
  const now = Date.now()
  const expMs = parseJwtExpiryMs(token)
  tokenCache = {
    token,
    expiresAt: expMs || (now + DEFAULT_TOKEN_TTL_MS),
  }
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

/**
 * Keshlangan tokenni tozalash (test yoki 401 dan keyin).
 */
export function clearEskizTokenCache() {
  tokenCache = { token: null, expiresAt: 0 }
}

/** Eskiz test hisobida ruxsat etilgan SMS matnlari */
export const ESKIZ_TEST_MESSAGES = [
  'Bu Eskiz dan test',
  'Это тест от Eskiz',
  'This is test from Eskiz',
]

export function isEskizTestMessage(text) {
  const normalized = String(text || '').trim()
  return ESKIZ_TEST_MESSAGES.some((item) => item === normalized)
}

/**
 * Telefon raqamini Eskiz formatiga keltirish: 998901234567
 * @param {string} phoneNumber
 * @returns {string}
 */
export function normalizePhoneForEskiz(phoneNumber) {
  let digits = String(phoneNumber || '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('998')) {
    return digits.slice(0, 12)
  }

  if (digits.length === 9) {
    return `998${digits}`
  }

  return digits
}

/**
 * Eskiz.uz dan JWT token olish (kesh bilan).
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<{ success: true, token: string } | { success: false, error: string }>}
 */
export async function getEskizToken(forceRefresh = false) {
  const now = Date.now()

  if (
    !forceRefresh
    && tokenCache.token
    && tokenCache.expiresAt > now + TOKEN_REFRESH_BUFFER_MS
  ) {
    return { success: true, token: tokenCache.token }
  }

  const staticToken = getStaticEskizToken()
  if (staticToken && !forceRefresh) {
    cacheToken(staticToken)
    return { success: true, token: staticToken }
  }

  const email = getEnv('ESKIZ_EMAIL')
  const password = getEnv('ESKIZ_PASSWORD')

  if (!email || !password) {
    const error = 'ESKIZ_TOKEN muddati tugagan yoki noto\'g\'ri. '
      + 'Yangi shlyuz token qo\'ying yoki ESKIZ_EMAIL + ESKIZ_PASSWORD kiriting.'
    console.error(`[Eskiz] ${error}`)
    return { success: false, error }
  }

  try {
    const form = new URLSearchParams()
    form.set('email', email)
    form.set('password', password)

    const response = await fetch(ESKIZ_AUTH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: form,
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = body?.message || body?.error || `Eskiz auth HTTP ${response.status}`
      console.error('[Eskiz] Auth xatosi:', error, body)
      return { success: false, error }
    }

    const token = body?.data?.token
    if (!token) {
      const error = 'Eskiz javobida token topilmadi'
      console.error('[Eskiz] Auth xatosi:', error, body)
      return { success: false, error }
    }

    const expMs = parseJwtExpiryMs(token)
    cacheToken(token)

    return { success: true, token }
  } catch (err) {
    const error = err?.message || 'Eskiz auth ulanishi xatosi'
    console.error('[Eskiz] Auth ulanish xatosi:', error)
    return { success: false, error }
  }
}

/**
 * SMS yuborish (Eskiz.uz).
 * @param {string} phoneNumber — +998 (90) 123-45-67 yoki 998901234567
 * @param {string} text — SMS matni
 * @returns {Promise<{ success: true, data: object } | { success: false, error: string, data?: object }>}
 */
export async function sendSMS(phoneNumber, text) {
  const mobile = normalizePhoneForEskiz(phoneNumber)
  if (!mobile || mobile.length < 12) {
    const error = 'Telefon raqami noto\'g\'ri. Kutilgan format: 998XXXXXXXXX'
    console.error('[Eskiz] SMS validatsiya:', error, { phoneNumber })
    return { success: false, error }
  }

  const message = String(text || '').trim()
  if (!message) {
    const error = 'SMS matni bo\'sh bo\'lishi mumkin emas'
    console.error('[Eskiz] SMS validatsiya:', error)
    return { success: false, error }
  }

  const from = getEnv('ESKIZ_FROM') || DEFAULT_SENDER

  const dispatch = async (token) => {
    const form = new URLSearchParams()
    form.set('mobile_phone', mobile)
    form.set('message', message)
    form.set('from', from)

    const response = await fetch(ESKIZ_SEND_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: form,
    })

    const data = await response.json().catch(() => ({}))
    return { response, data }
  }

  try {
    let tokenResult = await getEskizToken()
    if (!tokenResult.success) {
      return tokenResult
    }

    let { response, data } = await dispatch(tokenResult.token)

    if (response.status === 401) {
      clearEskizTokenCache()
      const hasLoginCreds = Boolean(getEnv('ESKIZ_EMAIL') && getEnv('ESKIZ_PASSWORD'))
      if (!hasLoginCreds) {
        const error = 'ESKIZ_TOKEN noto\'g\'ri yoki muddati tugagan. Kabinetdan yangi shlyuz token oling.'
        console.error('[Eskiz] SMS xatosi:', error)
        return { success: false, error, data }
      }
      tokenResult = await getEskizToken(true)
      if (!tokenResult.success) {
        return tokenResult
      }
      ;({ response, data } = await dispatch(tokenResult.token))
    }

    if (!response.ok) {
      const error = data?.message || data?.error || `Eskiz SMS HTTP ${response.status}`
      if (/для теста|test from eskiz|eskiz dan test/i.test(String(error))) {
        console.error(
          '[Eskiz] Test hisob: faqat ruxsat etilgan matnlar:',
          ESKIZ_TEST_MESSAGES.join(' | ')
        )
      } else {
        console.error('[Eskiz] SMS yuborish xatosi:', error, { mobile, data })
      }
      return { success: false, error, data }
    }

    console.log('[Eskiz] SMS muvaffaqiyatli yuborildi:', mobile)
    return { success: true, data }
  } catch (err) {
    const error = err?.message || 'SMS yuborishda kutilmagan xatolik'
    console.error('[Eskiz] SMS ulanish xatosi:', error)
    return { success: false, error }
  }
}

/*
 * =============================================================================
 * ISHLATISH NAMUNALARI (faqat server — Node.js yoki Supabase Edge Function)
 * =============================================================================
 *
 * --- 1) Telegram-bot: qabul eslatmasi yuborish ---
 *
 *   // telegram-bot/src/services/appointmentReminders.js
 *   const { sendSMS } = await import('../../../services/smsService.js')
 *
 *   const result = await sendSMS(
 *     patient.phone,
 *     `Salom! Ertaga soat 14:00 da qabulingiz bor. ShifoCRM`
 *   )
 *   if (!result.success) {
 *     console.warn('[SMS] Eslatma yuborilmadi:', result.error)
 *   }
 *
 * --- 2) Supabase Edge Function: onlayn yozilishdan keyin ---
 *
 *   // supabase/functions/send-booking-sms/index.js
 *   import { sendSMS } from '../../../services/smsService.js'
 *
 *   Deno.serve(async (req) => {
 *     const { phone, date, time, doctorName } = await req.json()
 *     const text = `Salom! ${date} ${time} da ${doctorName} qabuliga yozildingiz.`
 *     const result = await sendSMS(phone, text)
 *     return new Response(JSON.stringify(result), {
 *       headers: { 'Content-Type': 'application/json' },
 *       status: result.success ? 200 : 502,
 *     })
 *   })
 *
 * --- 3) visitsApi.js bilan integratsiya (to'g'ri yo'l) ---
 *
 *   Frontend (visitsApi.js) ichida to'g'ridan-to'g'ri import QILMANG.
 *   Oqim:
 *     visitsApi.createVisit()  →  Supabase visits jadvali
 *     DB trigger / Edge Function  →  sendSMS() chaqiriladi
 *
 *   // leadsApi convertLeadToBooked dan keyin (server hook misoli):
 *   // telegram-bot yoki alohida worker ichida:
 *   import { sendSMS } from '../../../services/smsService.js'
 *
 *   async function notifyPatientBooking(lead, visit) {
 *     const when = `${visit.date} ${visit.start_time}`
 *     await sendSMS(
 *       lead.phone,
 *       `Qabulingiz tasdiqlandi: ${when}. Klinikaga vaqtida keling.`
 *     )
 *   }
 *
 * Muhit: .env da ESKIZ_TOKEN (JWT) yoki ESKIZ_EMAIL + ESKIZ_PASSWORD.
 * telegram-bot ishga tushganda root .env yuklanadi (src/index.js).
 */
