/**
 * Telegram bot API client
 * ShifoCRM dan Telegram orqali xabar yuborish uchun
 */

const TELEGRAM_API_URL = import.meta.env.VITE_TELEGRAM_API_URL;
const TELEGRAM_API_KEY = import.meta.env.VITE_TELEGRAM_API_KEY;
const isDev = import.meta.env.DEV;

/** Development da CORS dan qochish uchun proxy orqali so'rov (localhost:5173 -> 3001) */
function getTelegramSendUrl() {
  const useProxy = isDev && (!TELEGRAM_API_URL || TELEGRAM_API_URL.includes('localhost:3001'));
  if (useProxy) return '/api/telegram/send';
  if (!TELEGRAM_API_URL) return null;
  return `${TELEGRAM_API_URL.replace(/\/$/, '')}/api/send`;
}

/**
 * Telegram orqali xabar yuborish
 * @param {Object} params
 * @param {string} params.patientId - Patient ID (ShifoCRM'dagi patient id)
 * @param {string} params.message - Xabar matni
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendTelegramNotification({ patientId, message }) {
  const sendUrl = getTelegramSendUrl();
  if (!sendUrl) {
    console.warn('TELEGRAM_API_URL sozlanmagan');
    return { ok: false, error: 'NOT_CONFIGURED' };
  }
  if (!patientId || !message) {
    return { ok: false, error: 'PATIENT_ID_AND_MESSAGE_REQUIRED' };
  }
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (TELEGRAM_API_KEY) {
      headers['X-API-KEY'] = TELEGRAM_API_KEY;
    }
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patient_id: String(patientId),
        message,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'UNKNOWN_ERROR' }));
      const errorCode = errorData.error || 'HTTP_ERROR';
      
      // Xatolik kodlarini handle qilish
      if (response.status === 401) {
        console.warn('Telegram API: UNAUTHORIZED - API key noto\'g\'ri');
        return { ok: false, error: 'UNAUTHORIZED' };
      }
      if (response.status === 404 || errorCode === 'CHAT_ID_NOT_FOUND') {
        console.warn('Telegram API: CHAT_ID_NOT_FOUND - Patient bot\'da ro\'yxatdan o\'tmagan');
        return { ok: false, error: 'CHAT_ID_NOT_FOUND' };
      }
      
      console.warn('Telegram API error:', errorData);
      return { ok: false, error: errorCode };
    }
    
    const result = await response.json().catch(() => ({ ok: true }));
    return result;
  } catch (error) {
    console.warn('Telegram API exception:', error);
    return { ok: false, error: error.message || 'NETWORK_ERROR' };
  }
}

/**
 * Qabul eslatmasi yuborish
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.appointmentDate - Sana va vaqt (masalan: "2024-01-25 15:00")
 * @param {string} params.doctorName - Shifokor ismi
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentReminder({ patientId, appointmentDate, doctorName }) {
  try {
    const message = `📅 Qabul eslatmasi:\n\n` +
      `Sana: ${appointmentDate}\n` +
      `Shifokor: ${doctorName}\n\n` +
      `Iltimos, vaqtida keling.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentReminder):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qarz eslatmasi yuborish
 * @param {Object} params
 * @param {string} params.patientId
 * @param {number} params.amount - Qarz miqdori
 * @param {string} params.dueDate - Muddat
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendDebtReminder({ patientId, amount, dueDate }) {
  try {
    const message = `💰 Qarz eslatmasi:\n\n` +
      `Miqdor: ${amount.toLocaleString('uz-UZ')} so'm\n` +
      `Muddat: ${dueDate}\n\n` +
      `Iltimos, to'lovni amalga oshiring.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendDebtReminder):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qabul tasdiqlandi xabari
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.appointmentDate
 * @param {string} params.doctorName
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentConfirmed({ patientId, appointmentDate, doctorName }) {
  try {
    const message = `✅ Qabulingiz tasdiqlandi!\n\n` +
      `Sana: ${appointmentDate}\n` +
      `Shifokor: ${doctorName}\n\n` +
      `Kutib qolamiz!`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentConfirmed):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qabul bekor qilindi xabari
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.reason - Sabab (ixtiyoriy)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentCanceled({ patientId, reason }) {
  try {
    const message = `❌ Qabulingiz bekor qilindi.\n\n` +
      (reason ? `Sabab: ${reason}\n\n` : '') +
      `Qayta qabulga yozilish uchun biz bilan bog'laning.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentCanceled):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}
