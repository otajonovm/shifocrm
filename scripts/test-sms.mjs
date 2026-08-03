/**
 * SMS test: node scripts/test-sms.mjs [telefon] [matn]
 * Masalan: node scripts/test-sms.mjs 940542722 "ShifoCRM test"
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sendSMS, normalizePhoneForTextUp, getTextUpAuth } from '../services/smsService.js'

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
}

loadEnvFile(rootEnv)

const phoneArg = process.argv[2] || '940542722'
// TextUp faqat tasdiqlangan shablon matnini qabul qiladi
const message = process.argv[3] || 'TextUp Platformasidan tasdiqlash kodingiz: 1929'

const hasLogin = Boolean(process.env.TEXTUP_EMAIL && process.env.TEXTUP_PASSWORD)

if (!hasLogin) {
  console.error('Xato: .env da TEXTUP_EMAIL va TEXTUP_PASSWORD bo\'lishi kerak.')
  console.error('')
  console.error('Misol:')
  console.error('  TEXTUP_EMAIL=your@email.uz')
  console.error('  TEXTUP_PASSWORD=your_password')
  console.error('  TEXTUP_USER_ID=uuid  # ixtiyoriy — login javobidan ham olinadi')
  console.error('')
  console.error('Fayl:', rootEnv)
  process.exit(1)
}

console.log('TextUp ga login qilinmoqda...')
const auth = await getTextUpAuth()
if (!auth.success) {
  console.error('Login xatosi:', auth.error)
  process.exit(1)
}
console.log('Login OK. userId:', auth.userId)

const normalized = normalizePhoneForTextUp(phoneArg)
console.log('Yuborilmoqda:', normalized)
console.log('Matn:', message)
if (!process.argv[3]) {
  console.log('(Default: .env dagi TEXTUP_TEMPLATE_ID shablon matni ishlatildi)')
}

const result = await sendSMS(phoneArg, message)
console.log(JSON.stringify(result, null, 2))
process.exit(result.success ? 0 : 1)
