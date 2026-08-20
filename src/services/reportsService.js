import { fetchClinicReportSources } from '@/api/reportsApi'
import { getVisitsByDateRange } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getSoloDoctorStats } from '@/api/soloStatsApi'
import { parseCategoryFromNote } from '@/api/paymentsApi'
import { cashIncome, isDiscountEntry, isTrueRefund, paymentDisplayAmount } from '@/lib/paymentTotals'
import {
  buildDailyBreakdown,
  buildDailyBreakdownRange,
  sumPayments,
  uniquePatients,
  weekDateRange,
} from '@/lib/weekReport'

const ACTIVE_VISIT = (v) => !['cancelled', 'no_show'].includes(String(v?.status || ''))

const METHOD_LABELS = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: "O'tkazma",
  unknown: "Noma'lum",
}

export function defaultReportRange(now = new Date()) {
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now)
  start.setDate(now.getDate() - 30)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end,
  }
}

export function reportCacheKey(clinicId, startDate, endDate) {
  return `${clinicId || 'none'}:${String(startDate || '').slice(0, 10)}:${String(endDate || '').slice(0, 10)}`
}

export function resolvePaymentMethodLabel(method) {
  return METHOD_LABELS[method] || method
}

function getWeekStart(date) {
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

function paymentNetForChart(entry) {
  const amt = Number(entry.amount) || 0
  const isAdditionalExpense = entry.payment_type === 'adjustment'
    && entry.note
    && entry.note.includes('[CATEGORY:')
  if (isAdditionalExpense) return -amt
  return cashIncome([entry])
}

export function buildRevenueData(payments = [], period = 'day') {
  if (period === 'week') {
    const byWeek = new Map()
    payments.forEach((p) => {
      const date = new Date(p.paid_at || '')
      if (Number.isNaN(date.getTime())) return
      const weekStart = getWeekStart(date)
      const weekKey = weekStart.toISOString().slice(0, 10)
      if (!byWeek.has(weekKey)) {
        byWeek.set(weekKey, {
          week: `Hafta ${weekStart.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}`,
          net_income: 0,
        })
      }
      byWeek.get(weekKey).net_income += paymentNetForChart(p)
    })
    return Array.from(byWeek.values()).sort((a, b) => a.week.localeCompare(b.week))
  }

  if (period === 'month') {
    const byMonth = new Map()
    payments.forEach((p) => {
      const date = (p.paid_at || '').slice(0, 7) + '-01'
      if (!date || date === '-01') return
      if (!byMonth.has(date)) {
        byMonth.set(date, { month: date, net_income: 0 })
      }
      byMonth.get(date).net_income += paymentNetForChart(p)
    })
    return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  const byDay = new Map()
  payments.forEach((p) => {
    const day = (p.paid_at || '').slice(0, 10)
    if (!day) return
    if (!byDay.has(day)) {
      byDay.set(day, { day, net_income: 0 })
    }
    byDay.get(day).net_income += paymentNetForChart(p)
  })
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day))
}

export function buildPaymentMethodRows(payments = []) {
  const map = new Map()
  payments.forEach((entry) => {
    if (isDiscountEntry(entry) || isTrueRefund(entry)) return
    const method = entry.method || 'unknown'
    if (!map.has(method)) {
      map.set(method, { method, total: 0, count: 0 })
    }
    const row = map.get(method)
    row.total += paymentDisplayAmount(entry)
    row.count += 1
  })
  return Array.from(map.values()).map((row) => ({
    ...row,
    label: resolvePaymentMethodLabel(row.method),
  }))
}

export function buildReportSummary({ payments = [], expenses = [], subtractExpenses = false } = {}) {
  const totals = payments.reduce(
    (acc, entry) => {
      if (isDiscountEntry(entry)) return acc
      if (entry.payment_type === 'payment') {
        const cash = cashIncome([entry])
        acc.totalPayments += cash
        acc.netIncome += cash
      } else if (isTrueRefund(entry)) {
        const amount = Math.abs(Number(entry.amount) || 0)
        acc.totalRefunds += amount
        acc.netIncome -= amount
      }
      return acc
    },
    { totalPayments: 0, totalRefunds: 0, netIncome: 0, totalAdditionalExpenses: 0 },
  )
  const expenseTotal = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  totals.totalAdditionalExpenses = expenseTotal
  if (subtractExpenses) {
    totals.netIncome -= expenseTotal
  }
  return {
    totalPayments: totals.totalPayments,
    totalRefunds: totals.totalRefunds,
    netIncome: totals.netIncome,
    totalAdditionalExpenses: totals.totalAdditionalExpenses,
    totalExpenses: expenseTotal,
    totalMovementsOut: 0,
  }
}

export function buildAdditionalExpenses(payments = []) {
  return payments
    .filter((p) => (
      p.payment_type === 'adjustment'
      && p.note
      && p.note.includes('[CATEGORY:')
      && parseCategoryFromNote(p.note)
    ))
    .map((p) => ({
      ...p,
      category: parseCategoryFromNote(p.note) || 'other',
    }))
    .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
}

export function buildWeekFromRange(visits = [], payments = [], startDate, endDate) {
  const startStr = String(startDate || '').slice(0, 10)
  const endStr = String(endDate || '').slice(0, 10)
  const activeVisits = (visits || []).filter(ACTIVE_VISIT)
  const dailyBreakdown = startStr && endStr
    ? buildDailyBreakdownRange(visits || [], payments || [], startStr, endStr)
    : buildDailyBreakdown(visits || [], payments || [], 7)
  return {
    dailyBreakdown,
    uniquePatients: uniquePatients(activeVisits),
    totalRevenue: sumPayments(payments || []),
  }
}

export async function getClinicWeekReport({ startDate, endDate, visits, payments } = {}) {
  const rolling = weekDateRange()
  const startStr = String(startDate || rolling.startStr).slice(0, 10)
  const endStr = String(endDate || rolling.endStr).slice(0, 10)
  const [visitRows, paymentRows] = await Promise.all([
    visits != null ? Promise.resolve(visits) : getVisitsByDateRange(startStr, endStr).catch(() => []),
    payments != null ? Promise.resolve(payments) : getPaymentsByDateRange(startStr, endStr).catch(() => []),
  ])
  return buildWeekFromRange(visitRows, paymentRows, startStr, endStr)
}

export async function loadClinicReportsBundle({ startDate, endDate } = {}) {
  const startStr = String(startDate || '').slice(0, 10)
  const endStr = String(endDate || '').slice(0, 10)
  const sources = await fetchClinicReportSources(startStr, endStr)
  return {
    ...sources,
    week: buildWeekFromRange(sources.visits, sources.payments, startStr, endStr),
  }
}

export async function getSoloWeekReport(doctorId, range = {}) {
  return getSoloDoctorStats(doctorId, range)
}
