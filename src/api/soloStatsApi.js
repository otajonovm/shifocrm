/**
 * Yakka doktor statistikasi — barcha ma'lumotlar faqat doctor_id bo'yicha.
 */

import { getVisitsByDoctorAndDate, getVisitsByDoctorAndDateRange } from './visitsApi'
import { getPaymentsByDoctorAndDateRange } from './paymentsApi'
import { getTodayISO } from '@/lib/date'

const ACTIVE_VISIT = (v) => !['cancelled', 'no_show'].includes(String(v?.status || ''))

const uniquePatients = (visits = []) => {
  const ids = new Set()
  for (const v of visits) {
    if (v?.patient_id != null) ids.add(Number(v.patient_id))
  }
  return ids.size
}

const sumPayments = (rows = []) =>
  rows.reduce((sum, p) => {
    const amt = Number(p.amount) || 0
    if (p.payment_type === 'refund') return sum - Math.abs(amt)
    return sum + amt
  }, 0)

const dayRange = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  return {
    dateStr: start.toISOString().slice(0, 10),
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  }
}

const buildDailyBreakdown = (visits = [], payments = [], days = 7) => {
  const now = new Date()
  const visitsByDate = {}
  const paysByDate = {}

  for (const v of visits) {
    const d = String(v.date || v.start_time || '').slice(0, 10)
    if (!d) continue
    if (!visitsByDate[d]) visitsByDate[d] = []
    visitsByDate[d].push(v)
  }

  for (const p of payments) {
    const d = String(p.paid_at || '').slice(0, 10)
    if (!d) continue
    if (!paysByDate[d]) paysByDate[d] = []
    paysByDate[d].push(p)
  }

  const breakdown = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const { dateStr } = dayRange(d)
    const dayVisits = (visitsByDate[dateStr] || []).filter(ACTIVE_VISIT)
    const dayPays = paysByDate[dateStr] || []
    breakdown.push({
      date: dateStr,
      label: d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' }),
      patients: uniquePatients(dayVisits),
      visits: dayVisits.length,
      revenue: sumPayments(dayPays),
    })
  }
  return breakdown
}

/**
 * @param {number|string} doctorId
 */
export async function getSoloDoctorStats(doctorId) {
  const id = Number(doctorId)
  if (!Number.isFinite(id)) {
    return {
      dailyPatients: 0,
      weeklyPatients: 0,
      dailyRevenue: 0,
      weeklyRevenue: 0,
      todayVisitsCount: 0,
      dailyBreakdown: [],
    }
  }

  const now = new Date()
  const today = getTodayISO()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const weekEndStr = today
  const { startISO: todayStart, endISO: todayEnd } = dayRange(now)
  const { startISO: weekStartISO, endISO: weekEndISO } = dayRange(now)

  const weekRangeStart = dayRange(weekStart)

  const [todayVisits, weekVisits, todayPayments, weekPayments] = await Promise.all([
    getVisitsByDoctorAndDate(id, today).catch(() => []),
    getVisitsByDoctorAndDateRange(id, weekStartStr, weekEndStr).catch(() => []),
    getPaymentsByDoctorAndDateRange(id, todayStart, todayEnd).catch(() => []),
    getPaymentsByDoctorAndDateRange(id, weekRangeStart.startISO, weekEndISO).catch(() => []),
  ])

  const activeToday = (todayVisits || []).filter(ACTIVE_VISIT)
  const activeWeek = (weekVisits || []).filter(ACTIVE_VISIT)

  return {
    dailyPatients: uniquePatients(activeToday),
    weeklyPatients: uniquePatients(activeWeek),
    dailyRevenue: sumPayments(todayPayments),
    weeklyRevenue: sumPayments(weekPayments),
    todayVisitsCount: activeToday.length,
    dailyBreakdown: buildDailyBreakdown(weekVisits, weekPayments, 7),
  }
}
