/**
 * Bot cashback jadvallari sozlanmaganda (TABLES_MISSING) CRM bazasidagi
 * patient_cashback_balances / cashback_transactions orqali hisob-kitob.
 */
import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from '@/api/supabaseConfig'
import { earnBaseFromPayment } from '@/lib/paymentTotals'

const BALANCES = 'patient_cashback_balances'
const TRANSACTIONS = 'cashback_transactions'

const toPatientId = (patientId) => {
  const n = Number(patientId)
  return Number.isFinite(n) ? n : patientId
}

const roundAmount = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n)
}

const earnAmountFromPayment = (paymentAmount, percent = 5) => {
  const amount = roundAmount(paymentAmount)
  const rate = Number(percent)
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 5
  return Math.round(amount * (safeRate / 100))
}

export async function getLocalCashbackBalanceRow(patientId) {
  const pid = toPatientId(patientId)
  if (pid == null || pid === '') return null
  const rows = await supabaseGet(
    BALANCES,
    `patient_id=eq.${pid}&select=balance&limit=1`,
  )
  return rows?.[0] || null
}

export async function getLocalCashbackBalance(patientId) {
  const row = await getLocalCashbackBalanceRow(patientId)
  const value = Number(row?.balance)
  return Number.isFinite(value) && value > 0 ? value : 0
}

export async function hasLocalCashbackTxn(patientId, paymentId, type) {
  return hasTxnForPayment(patientId, paymentId, type)
}

async function hasTxnForPayment(patientId, paymentId, type) {
  if (paymentId == null || paymentId === '') return false
  const rows = await supabaseGet(
    TRANSACTIONS,
    `patient_id=eq.${toPatientId(patientId)}&payment_id=eq.${encodeURIComponent(String(paymentId))}&type=eq.${type}&select=id&limit=1`,
  )
  return Array.isArray(rows) && rows.length > 0
}

async function applyBalanceChange(patientId, {
  balanceDelta = 0,
  lifetimeEarnedDelta = 0,
  lifetimeSpentDelta = 0,
}) {
  const pid = toPatientId(patientId)
  const rows = await supabaseGet(
    BALANCES,
    `patient_id=eq.${pid}&select=patient_id,balance,lifetime_earned,lifetime_spent&limit=1`,
  )
  const current = rows?.[0]
  const balance = Math.max(0, (Number(current?.balance) || 0) + balanceDelta)
  const lifetimeEarned = Math.max(0, (Number(current?.lifetime_earned) || 0) + lifetimeEarnedDelta)
  const lifetimeSpent = Math.max(0, (Number(current?.lifetime_spent) || 0) + lifetimeSpentDelta)
  const now = new Date().toISOString()

  if (current) {
    await supabasePatchWhere(
      BALANCES,
      `patient_id=eq.${pid}`,
      {
        balance,
        lifetime_earned: lifetimeEarned,
        lifetime_spent: lifetimeSpent,
        updated_at: now,
      },
    )
  } else {
    await supabasePost(BALANCES, {
      patient_id: pid,
      balance,
      lifetime_earned: lifetimeEarned,
      lifetime_spent: lifetimeSpent,
    })
  }

  return balance
}

export async function earnLocalCashback({
  patientId,
  paymentAmount,
  paymentId,
  percent = 5,
} = {}) {
  const earned = earnAmountFromPayment(paymentAmount, percent)
  if (!patientId || earned <= 0) {
    return { ok: true, earned: 0 }
  }
  try {
    if (await hasTxnForPayment(patientId, paymentId, 'earn')) {
      return { ok: true, earned: 0, duplicate: true }
    }
    const pid = toPatientId(patientId)
    const txn = await supabasePost(TRANSACTIONS, {
      patient_id: pid,
      amount: earned,
      type: 'earn',
      payment_id: paymentId != null ? String(paymentId) : undefined,
      note: 'CRM payment earn',
    })
    const balanceAfter = await applyBalanceChange(patientId, {
      balanceDelta: earned,
      lifetimeEarnedDelta: earned,
    })
    const txnId = Array.isArray(txn) ? txn[0]?.id : txn?.id
    if (txnId != null) {
      await supabasePatchWhere(
        TRANSACTIONS,
        `id=eq.${txnId}`,
        { balance_after: balanceAfter },
      ).catch(() => {})
    }
    return { ok: true, earned }
  } catch (error) {
    console.warn('Local cashback earn:', error?.message || error)
    return { ok: false, earned: 0, error: error?.message || 'LEDGER_EARN_FAILED' }
  }
}

/** Bot spend muvaffaqiyatli bo'lsa, qayta yechmaslik uchun marker (balansni qayta ayirmaydi). */
export async function recordLocalSpendMarker({ patientId, amount, paymentId } = {}) {
  const spent = roundAmount(amount)
  if (!patientId || spent <= 0 || paymentId == null || paymentId === '') {
    return { ok: true, spent: 0 }
  }
  try {
    if (await hasTxnForPayment(patientId, paymentId, 'spend')) {
      return { ok: true, spent: 0, duplicate: true }
    }
    await supabasePost(TRANSACTIONS, {
      patient_id: toPatientId(patientId),
      amount: spent,
      type: 'spend',
      payment_id: String(paymentId),
      note: 'CRM remote spend marker',
    })
    return { ok: true, spent: 0, marker: true }
  } catch (error) {
    console.warn('Local cashback spend marker:', error?.message || error)
    return { ok: false, spent: 0, error: error?.message || 'LEDGER_MARKER_FAILED' }
  }
}

export async function spendLocalCashback({
  patientId,
  amount,
  paymentId,
} = {}) {
  const spent = roundAmount(amount)
  if (!patientId || spent <= 0) {
    return { ok: true, spent: 0 }
  }
  try {
    if (await hasTxnForPayment(patientId, paymentId, 'spend')) {
      return { ok: true, spent: 0, duplicate: true }
    }
    const current = await getLocalCashbackBalance(patientId)
    if (current < spent) {
      return { ok: false, spent: 0, error: 'INSUFFICIENT_BALANCE' }
    }
    const pid = toPatientId(patientId)
    const txn = await supabasePost(TRANSACTIONS, {
      patient_id: pid,
      amount: spent,
      type: 'spend',
      payment_id: paymentId != null ? String(paymentId) : undefined,
      note: 'CRM payment spend',
    })
    const balanceAfter = await applyBalanceChange(patientId, {
      balanceDelta: -spent,
      lifetimeSpentDelta: spent,
    })
    const txnId = Array.isArray(txn) ? txn[0]?.id : txn?.id
    if (txnId != null) {
      await supabasePatchWhere(
        TRANSACTIONS,
        `id=eq.${txnId}`,
        { balance_after: balanceAfter },
      ).catch(() => {})
    }
    return { ok: true, spent }
  } catch (error) {
    console.warn('Local cashback spend:', error?.message || error)
    return { ok: false, spent: 0, error: error?.message || 'LEDGER_SPEND_FAILED' }
  }
}

/**
 * To'lov o'chirilganda shu to'lovning earn/spend yozuvlarini qaytaradi.
 */
export async function reverseLocalCashbackForPayment(payment) {
  const patientId = payment?.patient_id
  const paymentId = payment?.id
  if (patientId == null || paymentId == null || paymentId === '') {
    return { ok: true, reversed: 0 }
  }
  try {
    const rows = await supabaseGet(
      TRANSACTIONS,
      `patient_id=eq.${toPatientId(patientId)}&payment_id=eq.${encodeURIComponent(String(paymentId))}&select=id,type,amount`,
    )
    const txns = Array.isArray(rows) ? rows : []
    if (!txns.length) return { ok: true, reversed: 0 }

    let balanceDelta = 0
    let lifetimeEarnedDelta = 0
    let lifetimeSpentDelta = 0
    for (const txn of txns) {
      const amount = roundAmount(txn.amount)
      if (txn.type === 'earn') {
        balanceDelta -= amount
        lifetimeEarnedDelta -= amount
      } else if (txn.type === 'spend') {
        balanceDelta += amount
        lifetimeSpentDelta -= amount
      }
    }

    await applyBalanceChange(patientId, {
      balanceDelta,
      lifetimeEarnedDelta,
      lifetimeSpentDelta,
    })
    await supabaseDeleteWhere(
      TRANSACTIONS,
      `patient_id=eq.${toPatientId(patientId)}&payment_id=eq.${encodeURIComponent(String(paymentId))}`,
    )
    return { ok: true, reversed: txns.length }
  } catch (error) {
    console.warn('Local cashback reverse:', error?.message || error)
    return { ok: false, reversed: 0, error: error?.message || 'LEDGER_REVERSE_FAILED' }
  }
}

/**
 * Bot jadvallari ishlamasa: to'lovlardan hali yozilmagan keshbekni hisoblaydi.
 */
export async function syncLocalCashbackFromPayments(patientId, percent = 5) {
  const pid = toPatientId(patientId)
  if (pid == null || pid === '') return { ok: true, earned: 0 }

  try {
    let payments = []
    try {
      payments = await supabaseGet(
        'payments',
        `patient_id=eq.${pid}&payment_type=eq.payment&select=id,amount,cashback_used,note`,
      )
    } catch {
      payments = await supabaseGet(
        'payments',
        `patient_id=eq.${pid}&payment_type=eq.payment&select=id,amount,note`,
      ).catch(() => [])
    }

    const existingRows = await supabaseGet(
      TRANSACTIONS,
      `patient_id=eq.${pid}&type=eq.earn&select=payment_id`,
    ).catch(() => [])
    const existing = new Set(
      (existingRows || []).map((row) => String(row.payment_id || '')).filter(Boolean),
    )

    let earned = 0
    for (const payment of payments || []) {
      if (existing.has(String(payment.id))) continue
      const result = await earnLocalCashback({
        patientId: pid,
        paymentAmount: earnBaseFromPayment(payment),
        paymentId: payment.id,
        percent,
      })
      if (result.ok) earned += Number(result.earned) || 0
    }
    return { ok: true, earned }
  } catch (error) {
    console.warn('Local cashback sync:', error?.message || error)
    return { ok: false, earned: 0, error: error?.message || 'LEDGER_SYNC_FAILED' }
  }
}
