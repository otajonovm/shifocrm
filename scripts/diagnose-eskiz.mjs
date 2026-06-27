/**
 * Eskiz ulanish diagnostikasi (maxfiy ma'lumotlarni chiqarmaydi).
 * node scripts/diagnose-eskiz.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

function maskEmail(email) {
  const e = String(email || '')
  const at = e.indexOf('@')
  if (at <= 1) return e ? '***' : '(yo\'q)'
  return `${e.slice(0, 2)}***${e.slice(at)}`
}

loadEnvFile(rootEnv)

const email = process.env.ESKIZ_EMAIL || ''
const password = process.env.ESKIZ_PASSWORD || ''
const token = process.env.ESKIZ_TOKEN || ''

console.log('=== Eskiz diagnostika ===')
console.log('Email:', maskEmail(email), email ? `(uzunlik: ${email.length})` : '')
console.log('Parol:', password ? `bor (${password.length} belgi)` : 'yo\'q')
console.log('Shlyuz token:', token ? `${token.slice(0, 8)}... (${token.length} belgi)` : 'yo\'q')
console.log('')

if (token) {
  console.log('Shlyuz token bilan SMS sinovi (login API siz)...')
  const form = new URLSearchParams({
    mobile_phone: '998940542722',
    message: 'ShifoCRM diagnose test',
    from: process.env.ESKIZ_FROM || '4546',
  })
  const smsRes = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })
  const smsBody = await smsRes.json().catch(() => ({}))
  console.log('SMS HTTP:', smsRes.status)
  console.log('SMS javob:', smsBody?.message || smsBody?.status || JSON.stringify(smsBody).slice(0, 120))
  if (smsRes.ok) {
    console.log('')
    console.log('Token ishlayapti. SMS test: node scripts/test-sms.mjs 940542722 "ShifoCRM test"')
    process.exit(0)
  }
  console.log('')
}

if (!email || !password) {
  if (token) {
    console.log('Token bilan SMS yuborilmadi. Kabinetdan yangi shlyuz token oling yoki email+parol qo\'shing.')
    process.exit(1)
  }
  console.log('Xato: ESKIZ_TOKEN yoki ESKIZ_EMAIL + ESKIZ_PASSWORD kerak.')
  process.exit(1)
}

console.log('Email/parol bilan login sinovi...')
const form = new URLSearchParams()
form.set('email', email)
form.set('password', password)

const response = await fetch('https://notify.eskiz.uz/api/auth/login', {
  method: 'POST',
  headers: { Accept: 'application/json' },
  body: form,
})

const body = await response.json().catch(() => ({}))
console.log('HTTP:', response.status)
console.log('Javob:', body?.message || (body?.data?.token ? 'TOKEN olindi ✓' : JSON.stringify(body)))

if (!response.ok) {
  console.log('')
  console.log('Sabablar (eng ko\'p uchraydigan):')
  console.log('  1) ESKIZ_PASSWORD — sayt paroli emas, SMS shlyuz paroli bo\'lishi kerak')
  console.log('  2) Email Eskiz kabinetidagi bilan mos emas')
  console.log('  3) Hisob hali "Test" yoki tasdiqlanmagan')
  console.log('  4) .env da ortiqcha bo\'sh joy yoki noto\'g\'ri qo\'shtirnoq')
  process.exit(1)
}

console.log('')
console.log('Login muvaffaqiyatli. Endi SMS test:')
console.log('  node scripts/test-sms.mjs 940542722 "ShifoCRM test"')
