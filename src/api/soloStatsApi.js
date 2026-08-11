/**
 * Yakka doktor statistikasi — tashrif va to'lovlar.
 */

import { getVisitsByDoctorAndDate, getVisitsByDoctorAndDateRange } from './visitsApi'
import { getPaymentsByDateRange, getPaymentsByDoctorAndDateRange } from './paymentsApi'
import {
  buildDailyBreakdown,
  localDateStr,
  sumPayments,
  uniquePatients,
  weekDateRange,
} from '@/lib/weekReport'

const ACTIVE_VISIT = (v) => !['cancelled', 'no_show'].includes(String(v?.status || ''))

export async function getSoloDoctorStats(doctorId) {
  const id = Number(doctorId)
  const empty = {
    dailyPatients: 0,
    weeklyPatients: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    todayVisitsCount: 0,
    dailyBreakdown: [],
  }
  if (!Number.isFinite(id)) return empty

  const { startStr, endStr, todayStr } = weekDateRange()

  const [todayVisits, weekVisits, doctorPayments, clinicPayments] = await Promise.all([
    getVisitsByDoctorAndDate(id, todayStr).catch(() => []),
    getVisitsByDoctorAndDateRange(id, startStr, endStr).catch(() => []),
    getPaymentsByDoctorAndDateRange(id, startStr, endStr).catch(() => []),
    getPaymentsByDateRange(startStr, endStr).catch(() => []),
  ])

  const weekPayments = (doctorPayments || []).length ? doctorPayments : clinicPayments || []
  const activeToday = (todayVisits || []).filter(ACTIVE_VISIT)
  const activeWeek = (weekVisits || []).filter(ACTIVE_VISIT)
  const todayPays = (weekPayments || []).filter((p) => localDateStr(p.paid_at) === todayStr)

  return {
    dailyPatients: uniquePatients(activeToday),
    weeklyPatients: uniquePatients(activeWeek),
    dailyRevenue: sumPayments(todayPays),
    weeklyRevenue: sumPayments(weekPayments),
    todayVisitsCount: activeToday.length,
    dailyBreakdown: buildDailyBreakdown(weekVisits || [], weekPayments, 7),
  }
}
