/**
 * Telegram bot cashback API client.
 * To'lov saqlanishi cashback xatosida buzilmasin — funksiyalar throw qilmaydi.
 */

import { getTelegramApiBaseUrl, getTelegramApiHeaders } from './telegramApi'
import {
  earnLocalCashback,
  getLocalCashbackBalance,
  hasLocalCashbackTxn,
  recordLocalSpendMarker,
  spendLocalCashback,
  syncLocalCashbackFromPayments,
} from '@/services/cashbackLedgerService'

function isSetupIncomplete(result) {
  const reason = result?.data?.setup_reason || result?.error
  return Boolean(
    result?.data?.setup_required
    || reason === 'TABLES_MISSING'
    || reason === 'PERMISSION_DENIED'
    || reason === 'SETUP_REQUIRED',
  )
}

function getCashbackUrl(path) {
  const base = getTelegramApiBaseUrl()
  if (!base) return null
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (base === '/api/telegram') return `${base}${suffix}`
  return `${base}/api${suffix}`
}

function parseError(payload, fallback = 'HTTP_ERROR') {
  if (!payload) return fallback
  return payload.error || payload.message || fallback
}

function parseBalance(payload) {
  if (payload == null || typeof payload !== 'object') return 0
  const raw = payload.balance ?? payload.data?.balance ?? payload.amount ?? 0
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function parsePercent(payload) {
  if (payload == null || typeof payload !== 'object') return 5
  const raw = payload.cashback_percent ?? payload.percent ?? payload.data?.cashback_percent ?? 5
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 5
}

async function cashbackRequest(path, { method = 'GET', body } = {}) {
  const url = getCashbackUrl(path)
  if (!url) {
    return { ok: false, error: 'NOT_CONFIGURED' }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: getTelegramApiHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorCode = parseError(payload)
      console.warn('Cashback API xato:', response.status, errorCode, url)
      if (
        response.status === 502
        || response.status === 404
        || errorCode === 'TELEGRAM_BOT_UNREACHABLE'
        || errorCode === 'BOT_UNREACHABLE'
      ) {
        return { ok: false, error: 'TELEGRAM_BOT_UNREACHABLE', data: payload }
      }
      if (response.status === 401) {
        return { ok: false, error: 'UNAUTHORIZED', data: payload }
      }
      return { ok: false, error: errorCode, data: payload }
    }

    if (payload && payload.ok === false) {
      return { ok: false, error: parseError(payload, 'CASHBACK_ERROR'), data: payload }
    }

    return { ok: true, data: payload }
  } catch (error) {
    console.warn('Cashback API:', error?.message || 'NETWORK_ERROR')
    return { ok: false, error: error?.message || 'NETWORK_ERROR' }
  }
}

export async function getCashbackBalance(patientId) {
  if (patientId == null || patientId === '') {
    return { ok: false, error: 'PATIENT_ID_REQUIRED' }
  }
  const result = await cashbackRequest(`/cashback/balance/${encodeURIComponent(String(patientId))}`)
  if (result.ok && !isSetupIncomplete(result)) {
    return {
      ok: true,
      data: {
        ...(result.data && typeof result.data === 'object' ? result.data : {}),
        balance: parseBalance(result.data),
      },
    }
  }

  try {
    const config = await getCashbackConfig()
    const percent = config.ok ? parsePercent(config.data) : 5
    const sync = await syncLocalCashbackFromPayments(patientId, percent)
    const balance = await getLocalCashbackBalance(patientId)
    if (sync.ok || balance > 0) {
      return {
        ok: true,
        data: {
          balance,
          setup_required: false,
          source: 'ledger',
        },
      }
    }
    if (result.ok && isSetupIncomplete(result)) {
      return {
        ok: false,
        error: result.data?.setup_reason || 'SETUP_REQUIRED',
        data: result.data,
      }
    }
    return result.ok
      ? {
          ok: true,
          data: {
            ...(result.data && typeof result.data === 'object' ? result.data : {}),
            balance: parseBalance(result.data),
          },
        }
      : result
  } catch (error) {
    console.warn('Cashback ledger fallback:', error?.message || error)
    if (result.ok) {
      return {
        ok: true,
        data: {
          ...(result.data && typeof result.data === 'object' ? result.data : {}),
          balance: parseBalance(result.data),
        },
      }
    }
    return result
  }
}

export async function getCashbackConfig() {
  const result = await cashbackRequest('/cashback/config')
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      ...(result.data && typeof result.data === 'object' ? result.data : {}),
      cashback_percent: parsePercent(result.data),
    },
  }
}

export async function earnCashback({ patientId, paymentAmount, paymentId } = {}) {
  if (patientId == null || patientId === '') {
    return { ok: false, error: 'PATIENT_ID_REQUIRED' }
  }
  const amount = Number(paymentAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'PAYMENT_AMOUNT_REQUIRED' }
  }

  const body = {
    patient_id: String(patientId),
    payment_amount: amount,
    notify: true,
  }
  if (paymentId != null && paymentId !== '') {
    body.payment_id = String(paymentId)
  }

  return cashbackRequest('/cashback/earn', { method: 'POST', body })
}

export async function spendCashback({ patientId, amount, paymentId } = {}) {
  if (patientId == null || patientId === '') {
    return { ok: false, error: 'PATIENT_ID_REQUIRED' }
  }
  const spendAmount = Number(amount)
  if (!Number.isFinite(spendAmount) || spendAmount <= 0) {
    return { ok: false, error: 'AMOUNT_REQUIRED' }
  }

  const body = {
    patient_id: String(patientId),
    amount: spendAmount,
    notify: true,
  }
  if (paymentId != null && paymentId !== '') {
    body.payment_id = String(paymentId)
  }

  return cashbackRequest('/cashback/spend', { method: 'POST', body })
}

/**
 * To'lov DB ga yozilgach: avval spend, keyin naqd/karta qismidan earn.
 * Hech qachon throw qilmaydi.
 */
export async function applyPaymentCashback({
  patientId,
  paymentId,
  totalAmount,
  cashbackUsed,
} = {}) {
  const total = Math.max(0, Number(totalAmount) || 0)
  const used = Math.min(Math.max(0, Number(cashbackUsed) || 0), total)
  const remaining = total - used

  const result = {
    ok: true,
    spent: 0,
    earned: 0,
    error: null,
  }

  if (!patientId || total <= 0) {
    return result
  }

  try {
    if (used > 0) {
      const alreadySpent = paymentId != null && paymentId !== ''
        ? await hasLocalCashbackTxn(patientId, paymentId, 'spend')
        : false
      if (alreadySpent) {
        result.spent = used
        result.duplicate = true
      } else {
        let spendResult = await spendCashback({
          patientId,
          amount: used,
          paymentId,
        })
        if (!spendResult.ok || isSetupIncomplete(spendResult)) {
          spendResult = await spendLocalCashback({
            patientId,
            amount: used,
            paymentId,
          })
        } else {
          await recordLocalSpendMarker({
            patientId,
            amount: used,
            paymentId,
          })
        }
        if (!spendResult.ok) {
          result.ok = false
          result.error = spendResult.error || 'SPEND_FAILED'
          return result
        }
        result.spent = used
      }
    }

    if (remaining > 0) {
      let earnResult = await earnCashback({
        patientId,
        paymentAmount: remaining,
        paymentId,
      })
      if (!earnResult.ok || isSetupIncomplete(earnResult)) {
        const config = await getCashbackConfig()
        earnResult = await earnLocalCashback({
          patientId,
          paymentAmount: remaining,
          paymentId,
          percent: config.ok ? parsePercent(config.data) : 5,
        })
      }
      if (!earnResult.ok) {
        result.ok = false
        result.error = result.error || earnResult.error || 'EARN_FAILED'
      } else {
        result.earned = remaining
      }
    }
  } catch (error) {
    result.ok = false
    result.error = error?.message || 'CASHBACK_ERROR'
  }

  return result
}
