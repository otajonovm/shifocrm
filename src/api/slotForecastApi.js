/**
 * Slot prognoz API — dashboard uchun.
 */

import { getVisitsByDateRange } from '@/api/visitsApi'
import { buildSlotForecastSummary } from '@/lib/slotForecast'

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const getSlotForecastReport = async ({ days = 90 } = {}) => {
  const startDate = daysAgo(days)
  const endDate = daysAgo(0)

  const visits = await getVisitsByDateRange(startDate, endDate).catch(() => [])
  const list = Array.isArray(visits) ? visits : []

  return {
    period: { startDate, endDate, days },
    ...buildSlotForecastSummary(list),
  }
}
