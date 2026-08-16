/**
 * Solo shifokor billing: sozlamalar, tashrif xarajatlari, settlement, hisobot.
 * @module services/soloBillingService
 */

import {
  supabaseGet,
  supabasePost,
  supabasePatch,
  supabaseDelete,
  supabasePatchWhere,
} from '@/api/supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getVisitById } from '@/api/visitsApi'
import { getPaymentsByVisitId } from '@/api/paymentsApi'
import {
  BILLING_MODELS,
  DEFAULT_BILLING_SETTINGS,
  calculateVisitSettlement,
  daysInMonthOf,
  summarizeSettlements,
  toDateKey,
  toMonthKey,
  roundMoney,
} from '@/lib/soloBillingMath'

const SETTINGS_TABLE = 'doctor_billing_settings'
const EXPENSES_TABLE = 'visit_expenses'
const SETTLEMENTS_TABLE = 'visit_settlements'

const toResult = (data = null, error = null) => ({ data, error })

const isMissingRelation = (error) => {
  const msg = String(error?.message || '').toLowerCase()
  return error?.code === '42P01'
    || error?.status === 404
    || msg.includes('does not exist')
    || msg.includes('schema cache')
}

const requireClinicId = async () => {
  const cid = await getCurrentClinicId()
  if (!cid) {
    const err = { code: 'NO_CLINIC', message: 'Klinika tanlanmagan' }
    throw err
  }
  return Number(cid)
}

const netPaidFromPayments = (entries = []) => {
  let net = 0
  for (const entry of entries || []) {
    const amount = Number(entry.amount) || 0
    if (entry.payment_type === 'discount' || String(entry.note || '').includes('[DISCOUNT]')) {
      continue
    }
    if (entry.payment_type === 'refund') {
      net -= amount
      continue
    }
    net += amount
  }
  return Math.max(0, net)
}

const normalizeSettings = (row) => {
  if (!row) {
    return { ...DEFAULT_BILLING_SETTINGS }
  }
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    doctor_id: row.doctor_id,
    model: row.model || BILLING_MODELS.PERCENTAGE,
    doctor_percentage: Number(row.doctor_percentage) || 40,
    rent_type: row.rent_type || 'monthly',
    rent_amount: Number(row.rent_amount) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/** @returns {Promise<{data: object|null, error: object|null}>} */
export async function getDoctorBillingSettings(doctorId) {
  try {
    const cid = await requireClinicId()
    const id = Number(doctorId)
    if (!Number.isFinite(id)) {
      return toResult(null, { code: 'INVALID_DOCTOR', message: 'doctor_id noto‘g‘ri' })
    }
    const rows = await supabaseGet(
      SETTINGS_TABLE,
      `clinic_id=eq.${cid}&doctor_id=eq.${id}&select=*&limit=1`,
    )
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null
    return toResult(normalizeSettings(row || { clinic_id: cid, doctor_id: id }), null)
  } catch (error) {
    if (isMissingRelation(error)) {
      return toResult({ ...DEFAULT_BILLING_SETTINGS, doctor_id: Number(doctorId) }, null)
    }
    return toResult(null, {
      code: 'SETTINGS_LOAD_FAILED',
      message: error?.message || 'Billing sozlamalari yuklanmadi',
    })
  }
}

/** @returns {Promise<{data: object|null, error: object|null}>} */
export async function upsertDoctorBillingSettings(doctorId, payload = {}) {
  try {
    const cid = await requireClinicId()
    const id = Number(doctorId)
    if (!Number.isFinite(id)) {
      return toResult(null, { code: 'INVALID_DOCTOR', message: 'doctor_id noto‘g‘ri' })
    }

    const model = [BILLING_MODELS.PERCENTAGE, BILLING_MODELS.RENT, BILLING_MODELS.HYBRID]
      .includes(payload.model)
      ? payload.model
      : BILLING_MODELS.PERCENTAGE

    const body = {
      clinic_id: cid,
      doctor_id: id,
      model,
      doctor_percentage: Math.min(100, Math.max(0, Number(payload.doctor_percentage) || 0)),
      rent_type: payload.rent_type === 'daily' ? 'daily' : 'monthly',
      rent_amount: Math.max(0, Number(payload.rent_amount) || 0),
      updated_at: new Date().toISOString(),
    }

    const existing = await supabaseGet(
      SETTINGS_TABLE,
      `clinic_id=eq.${cid}&doctor_id=eq.${id}&select=id&limit=1`,
    ).catch(() => [])

    let row
    if (Array.isArray(existing) && existing[0]?.id) {
      row = await supabasePatch(SETTINGS_TABLE, existing[0].id, body)
      row = Array.isArray(row) ? row[0] : row
    } else {
      row = await supabasePost(SETTINGS_TABLE, body)
      row = Array.isArray(row) ? row[0] : row
    }
    return toResult(normalizeSettings(row), null)
  } catch (error) {
    return toResult(null, {
      code: 'SETTINGS_SAVE_FAILED',
      message: error?.message || 'Billing sozlamalari saqlanmadi',
    })
  }
}

export async function listVisitExpenses(visitId) {
  try {
    const cid = await requireClinicId()
    const rows = await supabaseGet(
      EXPENSES_TABLE,
      `clinic_id=eq.${cid}&visit_id=eq.${Number(visitId)}&order=created_at.desc`,
    )
    return toResult(Array.isArray(rows) ? rows : [], null)
  } catch (error) {
    if (isMissingRelation(error)) return toResult([], null)
    return toResult([], {
      code: 'EXPENSES_LOAD_FAILED',
      message: error?.message || 'Xarajatlar yuklanmadi',
    })
  }
}

export async function addVisitExpense({
  visitId,
  amount,
  category = 'zubotexnik',
  note = null,
  doctorId = null,
  patientId = null,
}) {
  try {
    const cid = await requireClinicId()
    const visit = await getVisitById(visitId)
    if (!visit) {
      return toResult(null, { code: 'VISIT_NOT_FOUND', message: 'Tashrif topilmadi' })
    }

    const payload = {
      clinic_id: cid,
      visit_id: Number(visitId),
      doctor_id: doctorId != null ? Number(doctorId) : (visit.doctor_id ? Number(visit.doctor_id) : null),
      patient_id: patientId != null ? Number(patientId) : (visit.patient_id ? Number(visit.patient_id) : null),
      category: ['zubotexnik', 'lab', 'material', 'other'].includes(category) ? category : 'other',
      amount: Math.max(0, Number(amount) || 0),
      note: note ? String(note).trim() : null,
    }

    if (payload.amount <= 0) {
      return toResult(null, { code: 'INVALID_AMOUNT', message: 'Xarajat summasi 0 dan katta bo‘lishi kerak' })
    }

    const rows = await supabasePost(EXPENSES_TABLE, payload)
    const created = Array.isArray(rows) ? rows[0] : rows

    await recalculateVisitSettlement(visitId).catch(() => {})

    return toResult(created, null)
  } catch (error) {
    return toResult(null, {
      code: 'EXPENSE_SAVE_FAILED',
      message: error?.message || 'Xarajat saqlanmadi',
    })
  }
}

export async function deleteVisitExpense(expenseId, visitId = null) {
  try {
    await supabaseDelete(EXPENSES_TABLE, expenseId)
    if (visitId) {
      await recalculateVisitSettlement(visitId).catch(() => {})
    }
    return toResult(true, null)
  } catch (error) {
    return toResult(null, {
      code: 'EXPENSE_DELETE_FAILED',
      message: error?.message || 'Xarajat o‘chirilmadi',
    })
  }
}

const countVisitsInPeriod = async ({ clinicId, doctorId, visitDate, rentType }) => {
  const dateKey = toDateKey(visitDate)
  if (!dateKey) return 1

  try {
    // Prefer visit_date column; fallback by created_at day
    const monthKey = toMonthKey(visitDate)
    const doctorFilter = doctorId ? `&doctor_id=eq.${Number(doctorId)}` : ''

    if (rentType === 'daily') {
      const byDate = await supabaseGet(
        'visits',
        `clinic_id=eq.${clinicId}${doctorFilter}&visit_date=eq.${dateKey}&select=id`,
      ).catch(() => null)
      if (Array.isArray(byDate) && byDate.length) return byDate.length

      const start = `${dateKey}T00:00:00`
      const end = `${dateKey}T23:59:59`
      const byCreated = await supabaseGet(
        'visits',
        `clinic_id=eq.${clinicId}${doctorFilter}&created_at=gte.${start}&created_at=lte.${end}&select=id`,
      ).catch(() => [])
      return Math.max(1, Array.isArray(byCreated) ? byCreated.length : 1)
    }

    // monthly
    const start = `${monthKey}-01`
    const days = daysInMonthOf(visitDate)
    const endDay = String(days).padStart(2, '0')
    const end = `${monthKey}-${endDay}`
    const byDate = await supabaseGet(
      'visits',
      `clinic_id=eq.${clinicId}${doctorFilter}&visit_date=gte.${start}&visit_date=lte.${end}&select=id`,
    ).catch(() => null)
    if (Array.isArray(byDate) && byDate.length) return byDate.length

    const byCreated = await supabaseGet(
      'visits',
      `clinic_id=eq.${clinicId}${doctorFilter}&created_at=gte.${start}T00:00:00&created_at=lte.${end}T23:59:59&select=id`,
    ).catch(() => [])
    return Math.max(1, Array.isArray(byCreated) ? byCreated.length : 1)
  } catch {
    return 1
  }
}

/**
 * To'lov yoki xarajat o'zgarganda tashrif settlementini qayta hisoblaydi.
 */
export async function recalculateVisitSettlement(visitId) {
  try {
    const cid = await requireClinicId()
    const visit = await getVisitById(visitId)
    if (!visit) return toResult(null, { code: 'VISIT_NOT_FOUND', message: 'Tashrif topilmadi' })

    const doctorId = visit.doctor_id ? Number(visit.doctor_id) : null
    const { data: settings } = await getDoctorBillingSettings(doctorId)

    const payments = await getPaymentsByVisitId(visitId).catch(() => [])
    const grossFromPayments = netPaidFromPayments(payments)
    const gross = grossFromPayments > 0
      ? grossFromPayments
      : Math.max(0, Number(visit.paid_amount) || Number(visit.price) || 0)

    const { data: expenses } = await listVisitExpenses(visitId)
    const expensesTotal = (expenses || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

    const visitDate = visit.visit_date || visit.start_at || visit.created_at || new Date()
    const rentType = settings?.rent_type || 'monthly'
    const visitsInPeriod = (settings?.model === BILLING_MODELS.RENT || settings?.model === BILLING_MODELS.HYBRID)
      ? await countVisitsInPeriod({
        clinicId: cid,
        doctorId,
        visitDate,
        rentType,
      })
      : 1

    const calc = calculateVisitSettlement({
      grossRevenue: gross,
      expensesTotal,
      settings,
      visitsInPeriod,
      daysInMonth: daysInMonthOf(visitDate),
    })

    const payload = {
      clinic_id: cid,
      visit_id: Number(visitId),
      doctor_id: doctorId,
      model: calc.model,
      gross_revenue: calc.gross_revenue,
      expenses_total: calc.expenses_total,
      net_after_expenses: calc.net_after_expenses,
      doctor_share: calc.doctor_share,
      clinic_share: calc.clinic_share,
      rent_allocated: calc.rent_allocated,
      doctor_percentage: calc.doctor_percentage,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const existing = await supabaseGet(
      SETTLEMENTS_TABLE,
      `visit_id=eq.${Number(visitId)}&select=id&limit=1`,
    ).catch(() => [])

    let row
    if (Array.isArray(existing) && existing[0]?.id) {
      row = await supabasePatch(SETTLEMENTS_TABLE, existing[0].id, payload)
      row = Array.isArray(row) ? row[0] : row
    } else {
      try {
        row = await supabasePost(SETTLEMENTS_TABLE, payload)
        row = Array.isArray(row) ? row[0] : row
      } catch (error) {
        // race: unique visit_id
        if (String(error?.message || '').includes('duplicate') || error?.code === '23505') {
          await supabasePatchWhere(SETTLEMENTS_TABLE, `visit_id=eq.${Number(visitId)}`, payload)
          const again = await supabaseGet(SETTLEMENTS_TABLE, `visit_id=eq.${Number(visitId)}&limit=1`)
          row = Array.isArray(again) ? again[0] : again
        } else {
          throw error
        }
      }
    }

    return toResult(row, null)
  } catch (error) {
    if (isMissingRelation(error)) {
      return toResult(null, null)
    }
    console.warn('visit settlement recalc:', error)
    return toResult(null, {
      code: 'SETTLEMENT_FAILED',
      message: error?.message || 'Hisob-kitob saqlanmadi',
    })
  }
}

/**
 * Sana oralig‘ida solo moliya hisoboti.
 */
export async function getSoloFinanceReport({
  doctorId,
  startDate,
  endDate,
}) {
  try {
    const cid = await requireClinicId()
    const id = Number(doctorId)
    if (!Number.isFinite(id)) {
      return toResult(null, { code: 'INVALID_DOCTOR', message: 'doctor_id noto‘g‘ri' })
    }

    const start = String(startDate || '').slice(0, 10)
    const end = String(endDate || '').slice(0, 10)
    if (!start || !end) {
      return toResult(null, { code: 'INVALID_RANGE', message: 'Sana oralig‘i kerak' })
    }

    const { data: settings } = await getDoctorBillingSettings(id)

    let settlements = []
    try {
      settlements = await supabaseGet(
        SETTLEMENTS_TABLE,
        `clinic_id=eq.${cid}&doctor_id=eq.${id}&calculated_at=gte.${start}T00:00:00&calculated_at=lte.${end}T23:59:59&order=calculated_at.desc`,
      )
    } catch (error) {
      if (!isMissingRelation(error)) throw error
      settlements = []
    }

    // Agar settlement yo'q bo'lsa — to'lovlardan soddalashtirilgan hisobot
    if (!Array.isArray(settlements) || settlements.length === 0) {
      const payments = await supabaseGet(
        'payments',
        `clinic_id=eq.${cid}&doctor_id=eq.${id}&paid_at=gte.${start}T00:00:00&paid_at=lte.${end}T23:59:59&select=id,amount,payment_type,note,visit_id,paid_at`,
      ).catch(() => [])

      const visitIds = [...new Set((payments || []).map((p) => p.visit_id).filter(Boolean))]
      const rebuilt = []
      for (const visitId of visitIds) {
        const visitPayments = (payments || []).filter((p) => Number(p.visit_id) === Number(visitId))
        const gross = netPaidFromPayments(visitPayments)
        const { data: expenses } = await listVisitExpenses(visitId)
        const expensesTotal = (expenses || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const visitDate = visitPayments[0]?.paid_at || start
        const calc = calculateVisitSettlement({
          grossRevenue: gross,
          expensesTotal,
          settings,
          visitsInPeriod: Math.max(1, visitIds.length),
          daysInMonth: daysInMonthOf(visitDate),
        })
        rebuilt.push({
          visit_id: visitId,
          ...calc,
          calculated_at: visitDate,
        })
      }
      settlements = rebuilt
    }

    const summary = summarizeSettlements(settlements)
    const expensesBreakdown = { zubotexnik: 0, lab: 0, material: 0, other: 0 }
    try {
      const expenseRows = await supabaseGet(
        EXPENSES_TABLE,
        `clinic_id=eq.${cid}&doctor_id=eq.${id}&created_at=gte.${start}T00:00:00&created_at=lte.${end}T23:59:59&select=category,amount`,
      )
      for (const row of expenseRows || []) {
        const key = expensesBreakdown[row.category] != null ? row.category : 'other'
        expensesBreakdown[key] += Number(row.amount) || 0
      }
    } catch {
      // ignore if table missing
    }

    return toResult({
      settings,
      range: { start, end },
      summary: {
        grossRevenue: roundMoney(summary.grossRevenue),
        expensesTotal: roundMoney(summary.expensesTotal),
        clinicShare: roundMoney(summary.clinicShare),
        rentAllocated: roundMoney(summary.rentAllocated),
        doctorNet: roundMoney(summary.doctorNet),
        visits: summary.visits,
        paidRentOrClinicShare: roundMoney(summary.clinicShare),
      },
      expensesBreakdown,
      rows: settlements,
    }, null)
  } catch (error) {
    return toResult(null, {
      code: 'REPORT_FAILED',
      message: error?.message || 'Moliyaviy hisobot yuklanmadi',
    })
  }
}

export { BILLING_MODELS, DEFAULT_BILLING_SETTINGS }
