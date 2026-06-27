/**
 * SMS test: node scripts/test-sms.mjs [telefon] [matn]
 * Masalan: node scripts/test-sms.mjs 940542722 "ShifoCRM test"
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sendSMS, normalizePhoneForEskiz, ESKIZ_TEST_MESSAGES } from '../services/smsService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = resolve(__dirname, '../.env')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  let text = readFileSync(filePath, 'utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    const inlineComment = value.indexOf(' #')
    if (inlineComment !== -1) value = value.slice(0, inlineComment).trim()
    value = value.replace(/^["']|["']$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
  // Eskiz_token kabi eski nomlarni normalizatsiya
  if (!process.env.ESKIZ_TOKEN && process.env.Eskiz_token) {
    process.env.ESKIZ_TOKEN = process.env.Eskiz_token
  }
}

loadEnvFile(rootEnv)

const phoneArg = process.argv[2] || '940542722'
const message = process.argv[3] || ESKIZ_TEST_MESSAGES[0]

const hasToken = Boolean(
  String(
    process.env.ESKIZ_TOKEN
    || process.env.ESKIZ_API_TOKEN
    || process.env.Eskiz_token
    || ''
  ).trim()
)
const hasLogin = Boolean(process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD)

if (!hasToken && !hasLogin) {
  console.error('Xato: .env da quyidagilardan biri bo\'lishi kerak:')
  console.error('  1) ESKIZ_TOKEN=...  (my.eskiz.uz SMS shlyuz tokeni)')
  console.error('  2) ESKIZ_EMAIL + ESKIZ_PASSWORD  (login orqali token olish)')
  console.error('')
  console.error('PMAk-... Postman kalitidir — Eskiz uchun ishlamaydi!')
  console.error('Fayl:', rootEnv)
  process.exit(1)
}

if (String(process.env.ESKIZ_TOKEN || '').startsWith('PMAK-')) {
  console.error('Xato: ESKIZ_TOKEN PMAK- bilan boshlanadi — bu Postman kaliti, Eskiz JWT emas.')
  console.error('Postmanda POST https://notify.eskiz.uz/api/auth/login → Body: { email, password }')
  console.error('Javobdagi data.token (eyJ...) ni ESKIZ_TOKEN ga qo\'ying.')
  process.exit(1)
}

const normalized = normalizePhoneForEskiz(phoneArg)
console.log('Yuborilmoqda:', normalized)
console.log('Matn:', message)
if (!process.argv[3]) {
  console.log('(Eskiz test hisobi: default ruxsat etilgan matn ishlatildi)')
}

const result = await sendSMS(phoneArg, message)
console.log(JSON.stringify(result, null, 2))
process.exit(result.success ? 0 : 1)
