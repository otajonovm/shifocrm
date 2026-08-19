import { getTelegramApiBaseUrl, getTelegramApiHeaders } from './telegramApi'

function getTreatmentPlanReminderUrl() {
  const base = getTelegramApiBaseUrl()
  if (!base) return null
  if (base === '/api/telegram') return `${base}/treatment-plans/send-reminder`
  return `${base}/api/treatment-plans/send-reminder`
}

function parseError(payload, fallback = 'HTTP_ERROR') {
  if (!payload) return fallback
  return payload.error || payload.message || fallback
}

/**
 * Davolash rejasi SMS eslatmasini TextUp orqali yuborish (server/bot).
 * @returns {Promise<{ ok: boolean, error?: string, message?: string, data?: object }>}
 */
export async function sendTreatmentPlanSmsReminder({
  planId,
  phone,
  title,
  plannedDate,
  patientName,
  text,
} = {}) {
  const url = getTreatmentPlanReminderUrl()
  if (!url) {
    return { ok: false, error: 'NOT_CONFIGURED' }
  }
  if (!planId && !phone) {
    return { ok: false, error: 'PLAN_OR_PHONE_REQUIRED' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getTelegramApiHeaders(),
      body: JSON.stringify({
        plan_id: planId ?? null,
        phone: phone || null,
        title: title || null,
        planned_date: plannedDate || null,
        patient_name: patientName || null,
        text: text || null,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        ok: false,
        error: parseError(payload),
        message: payload.message || payload.error,
        data: payload,
      }
    }

    if (payload && payload.ok === false) {
      return {
        ok: false,
        error: parseError(payload, 'SMS_SEND_FAILED'),
        message: payload.message,
        data: payload,
      }
    }

    return { ok: true, data: payload }
  } catch (error) {
    return { ok: false, error: error?.message || 'NETWORK_ERROR' }
  }
}
