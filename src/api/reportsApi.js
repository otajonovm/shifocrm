import { getPaymentsByDateRange } from './paymentsApi'
import { getVisitsByDateRange } from './visitsApi'
import { getTopServices } from './servicesApi'
import {
  listExpensesByDateRange,
  listInventoryItems,
  listInventoryMovementsByDateRange,
} from './inventoryApi'

/** Hisobot uchun barcha manbalarni sana oralig'ida parallel yuklash. */
export async function fetchClinicReportSources(startDate, endDate) {
  const start = String(startDate || '').slice(0, 10)
  const end = String(endDate || '').slice(0, 10)
  if (!start || !end) {
    throw new Error("Hisobot uchun sana oralig'i kerak")
  }

  const [payments, visits, expenses, movements, inventoryItems, topServices] = await Promise.all([
    getPaymentsByDateRange(start, end),
    getVisitsByDateRange(start, end).catch(() => []),
    listExpensesByDateRange(start, end).catch(() => []),
    listInventoryMovementsByDateRange(start, end).catch(() => []),
    listInventoryItems('order=name.asc').catch(() => []),
    getTopServices(10, { startDate: start, endDate: end }).catch(() => []),
  ])

  return {
    payments: payments || [],
    visits: visits || [],
    expenses: expenses || [],
    movements: movements || [],
    inventoryItems: inventoryItems || [],
    topServices: (topServices || []).slice(0, 10),
  }
}

export async function getSoloSummary(doctorId) {
  const { getSoloDoctorStats } = await import('./soloStatsApi')
  const stats = await getSoloDoctorStats(doctorId)
  return {
    todayVisitsCount: stats.todayVisitsCount,
    todayVisits: [],
    dailyRevenue: stats.dailyRevenue,
    nextPatient: null,
    newPatientsCount: stats.weeklyPatients,
    dailyPatients: stats.dailyPatients,
    weeklyPatients: stats.weeklyPatients,
    weeklyRevenue: stats.weeklyRevenue,
    dailyBreakdown: stats.dailyBreakdown,
  }
}

export default { getSoloSummary }
