/**
 * Davolash rejasi SMS eslatmasi — faqat server (telegram-bot / Vite middleware).
 * TextUp faqat tasdiqlangan shablon matnini qabul qiladi.
 */
import { sendSMS } from './smsService.js'
import { TEXTUP_TEST_SMS_TEXT } from '../src/lib/treatmentPlanSms.js'

function getEnv(key) {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

export { TEXTUP_TEST_SMS_TEXT }

export function getTextUpTestSmsText() {
  const fromEnv = String(getEnv('TEXTUP_TEST_MESSAGE') || '').replace(/^["']|["']$/g, '').trim()
  if (fromEnv && !/tasdiqlash kodingiz:\s*1929/i.test(fromEnv)) {
    return fromEnv
  }
  return TEXTUP_TEST_SMS_TEXT
}

export async function sendTreatmentPlanReminderSms({
  phone,
} = {}) {
  const message = getTextUpTestSmsText()
  const templateId = getEnv('TEXTUP_TEMPLATE_ID') || null

  console.log('[TextUp] SMS yuborilmoqda:', message)

  return sendSMS(phone, message, {
    templateId,
    isOtp: false,
  })
}
