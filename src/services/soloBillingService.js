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
import {
  getPaymentsByDateRange,
  getPaymentsByDoctorAndDateRange,
  getPaymentsByVisitId,
} from '@/api/paymentsApi'
import { cashIncome } from '@/lib/paymentTotals'
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

const isMissingTable = (error) => {
  const msg = String(error?.message || error?.hint || '').toLowerCase()
  const code = String(error?.code || '')
  return code === '42P01'
    || code === 'PGRST205'
    || error?.status === 404
    || msg.includes('does not exist')
    || msg.includes('could not find the table')
}

const isMissingColumn = (error) => {
  const msg = String(error?.message || error?.hint || '').toLowerCase()
  const code = String(error?.code || '')
  return code === 'PGRST204'
    || msg.includes('could not find the')
    || (msg.includes('schema cache') && msg.includes('column'))
}

const parsePercent = (value, fallback = 40) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const netPaidFromPayments = (entries = []) => Math.max(0, cashIncome(entries))

const requireClinicId = async () => {
  const cid = await getCurrentClinicId()
  if (!cid) {
    const err = { code: 'NO_CLINIC', message: 'Klinika tanlanmagan' }
    throw err
  }
  return Number(cid)
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
    doctor_percentage: parsePercent(row.doctor_percentage),
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
    if (isMissingTable(error)) {
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
    if (isMissingTable(error)) return toResult([], null)
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

    let payments = null
    try {
      payments = await getPaymentsByVisitId(visitId)
    } catch {
      payments = null
    }
    const gross = payments
      ? netPaidFromPayments(payments)
      : Math.max(0, Number(visit.paid_amount) || 0)

    const { data: expenses } = await listVisitExpenses(visitId)
    const expensesTotal = (expenses || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
    const labTechAmount = (expenses || []).reduce((sum, row) => {
      return ['zubotexnik', 'lab'].includes(row.category) ? sum + (Number(row.amount) || 0) : sum
    }, 0)
    const otherExpenseAmount = Math.max(0, expensesTotal - labTechAmount)

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

    const nowIso = new Date().toISOString()
    const livePayload = {
      clinic_id: cid,
      visit_id: Number(visitId),
      doctor_id: doctorId,
      patient_id: visit.patient_id != null ? Number(visit.patient_id) : null,
      work_type: calc.model || 'percentage',
      percentage_rate: calc.doctor_percentage,
      gross_amount: calc.gross_revenue,
      expense_amount: calc.expenses_total,
      lab_tech_amount: labTechAmount,
      other_expense_amount: otherExpenseAmount,
      net_amount: calc.net_after_expenses,
      rent_allocated: calc.rent_allocated,
      doctor_share: calc.doctor_share,
      clinic_share: calc.clinic_share,
      settled_at: nowIso,
      updated_at: nowIso,
    }
    const migrationPayload = {
      clinic_id: cid,
      visit_id: Number(visitId),
      doctor_id: doctorId,
      model: calc.model || 'percentage',
      gross_revenue: calc.gross_revenue,
      expenses_total: calc.expenses_total,
      net_after_expenses: calc.net_after_expenses,
      doctor_share: calc.doctor_share,
      clinic_share: calc.clinic_share,
      rent_allocated: calc.rent_allocated,
      doctor_percentage: calc.doctor_percentage,
      calculated_at: nowIso,
      updated_at: nowIso,
    }

    const writeSettlement = async (payload) => {
      const existing = await supabaseGet(
        SETTLEMENTS_TABLE,
        `visit_id=eq.${Number(visitId)}&select=id&limit=1`,
      ).catch(() => [])

      if (Array.isArray(existing) && existing[0]?.id) {
        const patched = await supabasePatch(SETTLEMENTS_TABLE, existing[0].id, payload)
        return Array.isArray(patched) ? patched[0] : patched
      }
      try {
        const created = await supabasePost(SETTLEMENTS_TABLE, payload)
        return Array.isArray(created) ? created[0] : created
      } catch (error) {
        if (String(error?.message || '').includes('duplicate') || error?.code === '23505') {
          await supabasePatchWhere(SETTLEMENTS_TABLE, `visit_id=eq.${Number(visitId)}`, payload)
          const again = await supabaseGet(SETTLEMENTS_TABLE, `visit_id=eq.${Number(visitId)}&limit=1`)
          return Array.isArray(again) ? again[0] : again
        }
        throw error
      }
    }

    let row
    try {
      row = await writeSettlement(livePayload)
    } catch (error) {
      if (!isMissingColumn(error)) throw error
      row = await writeSettlement(migrationPayload)
    }

    return toResult(row, null)
  } catch (error) {
    if (isMissingTable(error)) {
      return toResult(null, { code: 'SETTLEMENTS_TABLE_MISSING', message: 'visit_settlements jadvali yo‘q' })
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
      if (isMissingColumn(error)) {
        try {
          settlements = await supabaseGet(
            SETTLEMENTS_TABLE,
            `clinic_id=eq.${cid}&doctor_id=eq.${id}&settled_at=gte.${start}T00:00:00&settled_at=lte.${end}T23:59:59&order=settled_at.desc`,
          )
        } catch (retryError) {
          if (!isMissingTable(retryError) && !isMissingColumn(retryError)) throw retryError
          settlements = []
        }
      } else if (!isMissingTable(error)) {
        throw error
      }
    }

    const loadPeriodPayments = async () => {
      const doctorPayments = await getPaymentsByDoctorAndDateRange(id, start, end).catch(() => [])
      if (Array.isArray(doctorPayments) && doctorPayments.length) return doctorPayments
      const clinicPayments = await getPaymentsByDateRange(start, end).catch(() => [])
      if (Array.isArray(clinicPayments) && clinicPayments.length) return clinicPayments
      try {
        return await supabaseGet(
          'payments',
          `clinic_id=eq.${cid}&paid_at=gte.${start}T00:00:00&paid_at=lte.${end}T23:59:59`,
        )
      } catch {
        return []
      }
    }

    const payments = await loadPeriodPayments()
    const visitIds = [...new Set((payments || []).map((p) => p.visit_id).filter(Boolean))]
    const rebuilt = []
    for (const visitId of visitIds) {
      const visitPayments = (payments || []).filter((p) => Number(p.visit_id) === Number(visitId))
      const gross = netPaidFromPayments(visitPayments)
      const cached = (settlements || []).find((row) => Number(row.visit_id) === Number(visitId))
      const { data: expenses } = await listVisitExpenses(visitId)
      const expensesTotal = (expenses || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
      const visitDate = visitPayments[0]?.paid_at || cached?.calculated_at || cached?.settled_at || start
      const calc = calculateVisitSettlement({
        grossRevenue: gross,
        expensesTotal,
        settings,
        visitsInPeriod: Math.max(1, visitIds.length),
        daysInMonth: daysInMonthOf(visitDate),
      })
      rebuilt.push({
        ...(cached || {}),
        visit_id: visitId,
        ...calc,
        gross_revenue: calc.gross_revenue,
        expenses_total: calc.expenses_total,
        doctor_share: calc.doctor_share,
        clinic_share: calc.clinic_share,
        calculated_at: visitDate,
      })
    }

    const orphanPayments = (payments || []).filter((p) => p.visit_id == null || p.visit_id === '')
    if (orphanPayments.length) {
      const visitDate = orphanPayments[0]?.paid_at || start
      const calc = calculateVisitSettlement({
        grossRevenue: netPaidFromPayments(orphanPayments),
        expensesTotal: 0,
        settings,
        visitsInPeriod: Math.max(1, visitIds.length + 1),
        daysInMonth: daysInMonthOf(visitDate),
      })
      rebuilt.push({
        visit_id: null,
        ...calc,
        calculated_at: visitDate,
      })
    }

    if (rebuilt.length) {
      settlements = rebuilt
    } else if (Array.isArray(settlements) && settlements.length) {
      settlements = await Promise.all(settlements.map(async (row) => {
        let visitPayments = (payments || []).filter((p) => Number(p.visit_id) === Number(row.visit_id))
        if (!visitPayments.length && row.visit_id != null) {
          const allVisitPays = await getPaymentsByVisitId(row.visit_id).catch(() => [])
          visitPayments = (allVisitPays || []).filter((p) => {
            const day = String(p.paid_at || '').slice(0, 10)
            return day >= start && day <= end
          })
        }
        if (!visitPayments.length) return row
        const expensesTotal = Number(row.expenses_total ?? row.expense_amount) || 0
        const visitDate = row.calculated_at || row.settled_at || visitPayments[0]?.paid_at || start
        const calc = calculateVisitSettlement({
          grossRevenue: netPaidFromPayments(visitPayments),
          expensesTotal,
          settings,
          visitsInPeriod: Math.max(1, settlements.length),
          daysInMonth: daysInMonthOf(visitDate),
        })
        return {
          ...row,
          ...calc,
          gross_revenue: calc.gross_revenue,
          expenses_total: calc.expenses_total,
          doctor_share: calc.doctor_share,
          clinic_share: calc.clinic_share,
        }
      }))
    } else {
      settlements = []
    }

    const summary = summarizeSettlements(settlements)
    const liveGross = roundMoney(netPaidFromPayments(payments))
    if (liveGross > 0 && roundMoney(summary.grossRevenue) <= 0) {
      const calc = calculateVisitSettlement({
        grossRevenue: liveGross,
        expensesTotal: 0,
        settings,
        visitsInPeriod: 1,
        daysInMonth: daysInMonthOf(end),
      })
      settlements = [{ ...calc, visit_id: null, calculated_at: end }]
    }
    const totals = summarizeSettlements(settlements)
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
        grossRevenue: roundMoney(totals.grossRevenue),
        expensesTotal: roundMoney(totals.expensesTotal),
        clinicShare: roundMoney(totals.clinicShare),
        rentAllocated: roundMoney(totals.rentAllocated),
        doctorNet: roundMoney(totals.doctorNet),
        visits: totals.visits,
        paidRentOrClinicShare: roundMoney(totals.clinicShare),
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
