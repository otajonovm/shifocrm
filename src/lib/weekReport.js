import { cashIncome } from './paymentTotals'

const ACTIVE_VISIT = (v) => !['cancelled', 'no_show'].includes(String(v?.status || ''))

export function localDateStr(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value || '').slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalDate(value) {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return new Date(NaN)
  return new Date(year, month - 1, day)
}

export function uniquePatients(visits = []) {
  const ids = new Set()
  for (const v of visits) {
    if (v?.patient_id != null) ids.add(Number(v.patient_id))
  }
  return ids.size
}

export function sumPayments(rows = []) {
  return cashIncome(rows)
}

export function buildDailyBreakdown(visits = [], payments = [], days = 7, now = new Date()) {
  const visitsByDate = {}
  const paysByDate = {}

  for (const v of visits) {
    const d = String(v.date || '').slice(0, 10) || localDateStr(v.start_time)
    if (!d) continue
    if (!visitsByDate[d]) visitsByDate[d] = []
    visitsByDate[d].push(v)
  }

  for (const p of payments) {
    const d = localDateStr(p.paid_at)
    if (!d) continue
    if (!paysByDate[d]) paysByDate[d] = []
    paysByDate[d].push(p)
  }

  const breakdown = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dateStr = localDateStr(d)
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

export function buildDailyBreakdownRange(visits = [], payments = [], startStr, endStr) {
  const start = parseLocalDate(startStr)
  const end = parseLocalDate(endStr)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return buildDailyBreakdown(visits, payments, 7)
  }
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return buildDailyBreakdown(visits, payments, days, end)
}

export function weekDateRange(now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return {
    startStr: localDateStr(start),
    endStr: localDateStr(end),
    todayStr: localDateStr(end),
  }
}
