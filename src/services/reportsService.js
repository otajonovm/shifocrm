import { getVisitsByDateRange } from '@/api/visitsApi'
import { getPaymentsByDateRange } from '@/api/paymentsApi'
import { getSoloDoctorStats } from '@/api/soloStatsApi'
import { buildDailyBreakdown, weekDateRange } from '@/lib/weekReport'

export async function getClinicWeekReport() {
  const { startStr, endStr } = weekDateRange()
  const [visits, payments] = await Promise.all([
    getVisitsByDateRange(startStr, endStr).catch(() => []),
    getPaymentsByDateRange(startStr, endStr).catch(() => []),
  ])
  return {
    dailyBreakdown: buildDailyBreakdown(visits || [], payments || [], 7),
  }
}

export async function getSoloWeekReport(doctorId) {
  return getSoloDoctorStats(doctorId)
}
