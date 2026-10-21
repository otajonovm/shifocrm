/**
 * Super Admin + CRM access to dedicated doctor Telegram bots.
 * Token/webhook provisioning goes through the Node bot server (not the browser).
 */

import { supabaseGet, supabasePatch, supabaseDelete } from '@/api/supabaseConfig'
import { getTelegramApiBaseUrl, getTelegramApiHeaders } from '@/api/telegramApi'
import {
  DEFAULT_CASHBACK_PERCENT,
  DEFAULT_MAX_SPEND_PERCENT,
  DEFAULT_REFERRAL_BONUS,
  clampPercent,
  isValidBotToken,
  isValidBotUsername,
  normalizeBotUsername,
  stripBotUsername,
} from '@/lib/dedicatedBot'

const BOTS_TABLE = 'doctor_dedicated_bots'
const SETTINGS_VIEW = 'doctor_dedicated_bot_settings'
const DOCTORS_TABLE = 'doctors'

const SETTINGS_SELECT = [
  'id',
  'clinic_id',
  'doctor_id',
  'bot_token_last4',
  'bot_username',
  'bot_title',
  'welcome_message',
  'cashback_percent',
  'max_spend_percent',
  'referral_bonus',
  'is_active',
  'webhook_url',
  'created_at',
  'updated_at',
].join(',')

const LIST_SELECT = `${SETTINGS_SELECT},doctors(id,full_name,clinic_id,specialization),clinics(name)`

const PROVISION_TIMEOUT_MS = 12000
const NOTIFY_TIMEOUT_MS = 2500

const dedicatedConfigCache = new Map()

function firstRow(rows) {
  if (Array.isArray(rows)) return rows[0] || null
  return rows || null
}

function dedicatedApiUrl(path) {
  const dedicated = String(import.meta.env.VITE_DEDICATED_BOT_API_URL || '').replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (dedicated) return `${dedicated}/api${suffix}`
  const base = getTelegramApiBaseUrl()
  if (!base) return null
  if (base === '/api/telegram') return `${base}${suffix}`
  return `${base}/api${suffix}`
}

async function botServerRequest(path, { method = 'POST', body, timeoutMs = PROVISION_TIMEOUT_MS } = {}) {
  const url = dedicatedApiUrl(path)
  if (!url) {
    return { data: null, error: 'Telegram bot server manzili sozlanmagan (VITE_TELEGRAM_API_URL).' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      headers: getTelegramApiHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      return {
        data: null,
        error: payload?.message || payload?.error || `HTTP_${response.status}`,
      }
    }
    return { data: payload.data ?? payload, error: null }
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return {
      data: null,
      error: aborted ? 'Bot server javob bermadi (timeout).' : (error?.message || 'NETWORK_ERROR'),
    }
  } finally {
    clearTimeout(timer)
  }
}

function sanitizeBot(row) {
  if (!row) return null
  const doctor = row.doctors || null
  const clinic = row.clinics || null
  return {
    ...row,
    bot_token: undefined,
    webhook_secret: undefined,
    doctor_name: doctor?.full_name || row.doctor_name || '',
    doctor_specialization: doctor?.specialization || '',
    clinic_name: clinic?.name || row.clinic_name || '',
  }
}

export function validateDoctorBotInput(input, { requireToken = true } = {}) {
  const doctorId = Number(input?.doctor_id)
  if (!Number.isFinite(doctorId) || doctorId <= 0) {
    return 'Shifokorni tanlang.'
  }

  const username = normalizeBotUsername(input?.bot_username)
  if (!isValidBotUsername(username)) {
    return 'Bot username @ bilan, masalan: @DrAliyev_Bot'
  }

  const token = String(input?.bot_token || '').trim()
  if (requireToken && !isValidBotToken(token)) {
    return 'Bot token noto\'g\'ri. BotFather dagi tokenni tekshiring.'
  }
  if (!requireToken && token && !isValidBotToken(token)) {
    return 'Bot token noto\'g\'ri. Bo\'sh qoldiring yoki to\'g\'ri token kiriting.'
  }

  const cashbackPercent = clampPercent(input?.cashback_percent, DEFAULT_CASHBACK_PERCENT)
  const maxSpendPercent = clampPercent(input?.max_spend_percent, DEFAULT_MAX_SPEND_PERCENT)
  const referralBonus = Number(input?.referral_bonus)
  if (!Number.isFinite(referralBonus) || referralBonus < 0) {
    return 'Referal bonus 0 yoki undan katta bo\'lishi kerak.'
  }

  return null
}

export async function listAllDoctorsForBots() {
  try {
    const rows = await supabaseGet(
      DOCTORS_TABLE,
      'select=id,full_name,clinic_id,specialization,is_active,clinics(name)&order=full_name.asc',
    )
    return {
      data: (Array.isArray(rows) ? rows : []).map((row) => ({
        id: row.id,
        full_name: row.full_name,
        clinic_id: row.clinic_id,
        specialization: row.specialization,
        is_active: row.is_active !== false,
        clinic_name: row.clinics?.name || '',
      })),
      error: null,
    }
  } catch (error) {
    return { data: [], error: error?.message || 'Shifokorlar yuklanmadi' }
  }
}

export async function listDoctorBots() {
  try {
    const rows = await supabaseGet(
      BOTS_TABLE,
      `select=${LIST_SELECT}&order=created_at.desc`,
    )
    return { data: (Array.isArray(rows) ? rows : []).map(sanitizeBot), error: null }
  } catch (error) {
    try {
      const rows = await supabaseGet(
        SETTINGS_VIEW,
        `select=${SETTINGS_SELECT}&order=created_at.desc`,
      )
      return { data: (Array.isArray(rows) ? rows : []).map(sanitizeBot), error: null }
    } catch (fallbackError) {
      return { data: [], error: fallbackError?.message || error?.message || 'Botlar yuklanmadi' }
    }
  }
}

export async function getDoctorBot(id) {
  if (!id) return { data: null, error: 'ID_REQUIRED' }
  try {
    const rows = await supabaseGet(
      BOTS_TABLE,
      `id=eq.${encodeURIComponent(String(id))}&select=${LIST_SELECT}&limit=1`,
    )
    return { data: sanitizeBot(firstRow(rows)), error: null }
  } catch (error) {
    return { data: null, error: error?.message || 'Bot topilmadi' }
  }
}

export async function getActiveDedicatedBotConfig(doctorId) {
  const id = Number(doctorId)
  if (!Number.isFinite(id) || id <= 0) return null
  const cacheKey = String(id)
  const cached = dedicatedConfigCache.get(cacheKey)
  if (cached && (Date.now() - cached.at) < 60 * 1000) {
    return cached.value
  }
  try {
    const rows = await supabaseGet(
      BOTS_TABLE,
      `doctor_id=eq.${id}&is_active=eq.true&select=${SETTINGS_SELECT}&limit=1`,
    )
    const row = firstRow(rows)
    const value = row
      ? {
          id: row.id,
          doctor_id: row.doctor_id,
          clinic_id: row.clinic_id,
          bot_username: row.bot_username,
          bot_title: row.bot_title,
          cashback_percent: clampPercent(row.cashback_percent, DEFAULT_CASHBACK_PERCENT),
          max_spend_percent: clampPercent(row.max_spend_percent, DEFAULT_MAX_SPEND_PERCENT),
          referral_bonus: Number(row.referral_bonus) || DEFAULT_REFERRAL_BONUS,
          is_active: true,
        }
      : null
    dedicatedConfigCache.set(cacheKey, { at: Date.now(), value })
    return value
  } catch {
    dedicatedConfigCache.set(cacheKey, { at: Date.now(), value: null })
    return null
  }
}

export function clearDedicatedBotConfigCache(doctorId) {
  if (doctorId == null) {
    dedicatedConfigCache.clear()
    return
  }
  dedicatedConfigCache.delete(String(doctorId))
}

function buildProvisionPayload(input) {
  const token = String(input.bot_token || '').trim()
  return {
    id: input.id || undefined,
    doctor_id: Number(input.doctor_id),
    clinic_id: input.clinic_id != null ? Number(input.clinic_id) : undefined,
    bot_token: token || undefined,
    bot_username: normalizeBotUsername(input.bot_username),
    bot_title: String(input.bot_title || '').trim() || null,
    welcome_message: String(input.welcome_message || '').trim() || null,
    cashback_percent: clampPercent(input.cashback_percent, DEFAULT_CASHBACK_PERCENT),
    max_spend_percent: clampPercent(input.max_spend_percent, DEFAULT_MAX_SPEND_PERCENT),
    referral_bonus: Number(input.referral_bonus) >= 0 ? Number(input.referral_bonus) : DEFAULT_REFERRAL_BONUS,
    is_active: input.is_active !== false,
  }
}

export async function activateDoctorBot(input) {
  const requireToken = !input?.id
  const validationError = validateDoctorBotInput(input, { requireToken })
  if (validationError) {
    return { data: null, error: validationError }
  }
  const result = await botServerRequest('/dedicated-bots/provision', {
    body: buildProvisionPayload(input),
  })
  if (!result.error) {
    clearDedicatedBotConfigCache(input.doctor_id)
  }
  return result
}

export async function updateDoctorBotSettings(id, input) {
  if (!id) return { data: null, error: 'ID_REQUIRED' }
  const token = String(input?.bot_token || '').trim()
  if (token) {
    return activateDoctorBot({ ...input, id })
  }
  try {
    const payload = {
      bot_username: normalizeBotUsername(input.bot_username),
      bot_title: String(input.bot_title || '').trim() || null,
      welcome_message: String(input.welcome_message || '').trim() || null,
      cashback_percent: clampPercent(input.cashback_percent, DEFAULT_CASHBACK_PERCENT),
      max_spend_percent: clampPercent(input.max_spend_percent, DEFAULT_MAX_SPEND_PERCENT),
      referral_bonus: Number(input.referral_bonus) >= 0 ? Number(input.referral_bonus) : DEFAULT_REFERRAL_BONUS,
      is_active: input.is_active !== false,
    }
    const rows = await supabasePatch(BOTS_TABLE, id, payload)
    clearDedicatedBotConfigCache(input.doctor_id)
    return { data: sanitizeBot(firstRow(rows)), error: null }
  } catch (error) {
    return { data: null, error: error?.message || 'Saqlashda xatolik' }
  }
}

export async function deactivateDoctorBot({ id, doctorId } = {}) {
  const result = await botServerRequest('/dedicated-bots/deactivate', {
    body: { id, doctor_id: doctorId },
  })
  if (!result.error) {
    clearDedicatedBotConfigCache(doctorId)
  }
  return result
}

export async function deleteDoctorBot({ id, doctorId } = {}) {
  const deactivated = await deactivateDoctorBot({ id, doctorId })
  if (deactivated.error && !/not found|404/i.test(String(deactivated.error))) {
    // still try DB delete if webhook already gone
  }
  try {
    if (id) await supabaseDelete(BOTS_TABLE, id)
    clearDedicatedBotConfigCache(doctorId)
    return { data: { ok: true }, error: null }
  } catch (error) {
    return { data: null, error: error?.message || deactivated.error || 'O\'chirishda xatolik' }
  }
}

export async function notifyDedicatedCashback({
  doctorId,
  patientId,
  earnedAmount,
} = {}) {
  const id = Number(doctorId)
  const pid = Number(patientId)
  const earned = Math.round(Number(earnedAmount) || 0)
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(pid) || pid <= 0 || earned <= 0) {
    return { ok: false, error: 'NOTIFY_SKIPPED' }
  }
  const result = await botServerRequest('/dedicated-bots/notify', {
    body: {
      doctor_id: id,
      patient_id: pid,
      earned_amount: earned,
    },
    timeoutMs: NOTIFY_TIMEOUT_MS,
  })
  return { ok: !result.error, error: result.error || null, data: result.data }
}

export function botUsernameForLink(username) {
  return stripBotUsername(username)
}
