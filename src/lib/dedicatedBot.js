/**
 * Dedicated doctor Telegram cashback bot helpers (validation + copy).
 */

export const DEFAULT_CASHBACK_PERCENT = 5
export const DEFAULT_MAX_SPEND_PERCENT = 30
export const DEFAULT_REFERRAL_BONUS = 20000

const TOKEN_RE = /^\d{6,}:[A-Za-z0-9_-]{20,}$/
const USERNAME_RE = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/

export function normalizeBotUsername(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const withoutAt = raw.replace(/^@+/, '')
  return withoutAt ? `@${withoutAt}` : ''
}

export function stripBotUsername(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

export function isValidBotToken(value) {
  return TOKEN_RE.test(String(value || '').trim())
}

export function isValidBotUsername(value) {
  return USERNAME_RE.test(String(value || '').trim())
}

export function tokenLast4(value) {
  const token = String(value || '').trim()
  if (token.length < 4) return ''
  return token.slice(-4)
}

export function maskBotToken(last4) {
  const tail = String(last4 || '').trim()
  if (!tail) return '••••'
  return `••••${tail}`
}

export function clampPercent(value, fallback = DEFAULT_CASHBACK_PERCENT) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

export function parseReferralStartPayload(text) {
  const raw = String(text || '')
  const match = raw.match(/\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?/i)
  const payload = match && match[1] ? String(match[1]).trim() : ''
  const ref = payload.match(/^ref[_-]?(\d+)$/i)
  return {
    payload,
    referrerPatientId: ref ? Number(ref[1]) : null,
  }
}

export function formatDoctorLabel(fullName) {
  const name = String(fullName || '').trim() || 'Shifokor'
  if (/^(dr\.?|доктор)\s/i.test(name)) return name
  return `Dr. ${name}`
}

export function formatSomAmount(value) {
  const n = Math.round(Number(value) || 0)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatDedicatedCashbackNotify({ doctorName, earnedAmount } = {}) {
  const label = formatDoctorLabel(doctorName)
  const amount = formatSomAmount(earnedAmount)
  return `${label} qabulidagi to'lovingiz uchun ${amount} so'm keshbek hisoblandi!`
}

export function earnAmountFromPercent(paymentAmount, percent = DEFAULT_CASHBACK_PERCENT) {
  const amount = Math.max(0, Math.round(Number(paymentAmount) || 0))
  const rate = clampPercent(percent, DEFAULT_CASHBACK_PERCENT)
  if (amount <= 0 || rate <= 0) return 0
  return Math.round(amount * (rate / 100))
}

export function maxSpendableCashback({
  paymentAmount,
  balance,
  maxSpendPercent = null,
} = {}) {
  const amount = Math.max(0, Number(paymentAmount) || 0)
  const available = Math.max(0, Number(balance) || 0)
  let cap = Math.min(amount, available)
  if (maxSpendPercent != null && maxSpendPercent !== '') {
    const pct = clampPercent(maxSpendPercent, DEFAULT_MAX_SPEND_PERCENT)
    cap = Math.min(cap, Math.round(amount * (pct / 100)))
  }
  return Math.max(0, cap)
}

export function usernamesMatch(entered, fromTelegram) {
  return stripBotUsername(entered).toLowerCase() === stripBotUsername(fromTelegram).toLowerCase()
}
