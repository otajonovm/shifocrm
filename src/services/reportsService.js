import { getVisitsByDateRange } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getSoloDoctorStats } from '@/api/soloStatsApi'
import {
  buildDailyBreakdown,
  buildDailyBreakdownRange,
  sumPayments,
  uniquePatients,
  weekDateRange,
} from '@/lib/weekReport'

const ACTIVE_VISIT = (v) => !['cancelled', 'no_show'].includes(String(v?.status || ''))

export async function getClinicWeekReport({ startDate, endDate } = {}) {
  const rolling = weekDateRange()
  const startStr = String(startDate || rolling.startStr).slice(0, 10)
  const endStr = String(endDate || rolling.endStr).slice(0, 10)
  const [visits, payments] = await Promise.all([
    getVisitsByDateRange(startStr, endStr).catch(() => []),
    getPaymentsByDateRange(startStr, endStr).catch(() => []),
  ])
  const activeVisits = (visits || []).filter(ACTIVE_VISIT)
  const dailyBreakdown = startDate && endDate
    ? buildDailyBreakdownRange(visits || [], payments || [], startStr, endStr)
    : buildDailyBreakdown(visits || [], payments || [], 7)
  return {
    dailyBreakdown,
    uniquePatients: uniquePatients(activeVisits),
    totalRevenue: sumPayments(payments || []),
  }
}

export async function getSoloWeekReport(doctorId, range = {}) {
  return getSoloDoctorStats(doctorId, range)
}
