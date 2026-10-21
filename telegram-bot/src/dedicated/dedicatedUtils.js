function normalizeBotUsername(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const withoutAt = raw.replace(/^@+/, '')
  return withoutAt ? `@${withoutAt}` : ''
}

function stripBotUsername(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

function tokenLast4(value) {
  const token = String(value || '').trim()
  if (token.length < 4) return ''
  return token.slice(-4)
}

function clampPercent(value, fallback = 5) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

function parseReferralStartPayload(text) {
  const raw = String(text || '')
  const match = raw.match(/\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?/i)
  const payload = match && match[1] ? String(match[1]).trim() : ''
  const ref = payload.match(/^ref[_-]?(\d+)$/i)
  return {
    payload,
    referrerPatientId: ref ? Number(ref[1]) : null,
  }
}

function formatDoctorLabel(fullName) {
  const name = String(fullName || '').trim() || 'Shifokor'
  if (/^(dr\.?|доктор)\s/i.test(name)) return name
  return `Dr. ${name}`
}

function formatSomAmount(value) {
  const n = Math.round(Number(value) || 0)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatDedicatedCashbackNotify({ doctorName, earnedAmount } = {}) {
  const label = formatDoctorLabel(doctorName)
  const amount = formatSomAmount(earnedAmount)
  return `${label} qabulidagi to'lovingiz uchun ${amount} so'm keshbek hisoblandi!`
}

function usernamesMatch(entered, fromTelegram) {
  return stripBotUsername(entered).toLowerCase() === stripBotUsername(fromTelegram).toLowerCase()
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return null
}

const MENU = {
  BALANCE: '💰 Mening keshbek balansim',
  REFERRAL: '🎁 Do\'stimni taklif qilish',
}

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: MENU.BALANCE }],
      [{ text: MENU.REFERRAL }],
    ],
    resize_keyboard: true,
  }
}

function publicAppUrl() {
  return String(process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_APP_URL || '').replace(/\/$/, '')
}

function telegramPublicUrl() {
  return String(
    process.env.TELEGRAM_PUBLIC_URL
    || process.env.VITE_TELEGRAM_API_URL
    || '',
  ).replace(/\/$/, '')
}

function dedicatedWebhookUrl(doctorId) {
  const base = telegramPublicUrl()
  if (!base) return null
  return `${base}/api/webhook/dedicated/${doctorId}`
}

module.exports = {
  MENU,
  clampPercent,
  dedicatedWebhookUrl,
  formatDedicatedCashbackNotify,
  formatDoctorLabel,
  formatSomAmount,
  mainKeyboard,
  normalizeBotUsername,
  normalizePhone,
  parseReferralStartPayload,
  publicAppUrl,
  stripBotUsername,
  telegramPublicUrl,
  tokenLast4,
  usernamesMatch,
}
