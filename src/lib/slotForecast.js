/**
 * No-show / slot prognoz (qoidalar asosida ML-lite).
 */

const CANCELLED = new Set(['cancelled', 'canceled', 'no_show'])

const parseHour = (visit) => {
  const t = visit?.start_time || visit?.time
  if (!t) return null
  const parts = String(t).split(':')
  const h = Number(parts[0])
  return Number.isFinite(h) ? h : null
}

const parseDayOfWeek = (visit) => {
  const d = visit?.date || visit?.created_at
  if (!d) return null
  return new Date(d).getDay()
}

export const buildNoShowRiskBySlot = (visits = []) => {
  const buckets = {}

  for (const visit of visits) {
    const status = String(visit?.status || '').toLowerCase()
    const dow = parseDayOfWeek(visit)
    const hour = parseHour(visit)
    if (dow == null || hour == null) continue

    const key = `${dow}-${hour}`
    if (!buckets[key]) {
      buckets[key] = { dow, hour, total: 0, noShow: 0 }
    }
    buckets[key].total += 1
    if (status === 'no_show') buckets[key].noShow += 1
  }

  return Object.values(buckets)
    .map((b) => ({
      ...b,
      rate: b.total ? Math.round((b.noShow / b.total) * 1000) / 10 : 0,
      label: formatSlotLabel(b.dow, b.hour),
    }))
    .sort((a, b) => b.rate - a.rate)
}

const DAY_NAMES = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

export const formatSlotLabel = (dow, hour) =>
  `${DAY_NAMES[dow] || dow} ${String(hour).padStart(2, '0')}:00`

/** Eng xavfsiz (past no-show) slotlar */
export const suggestBestSlots = (visits = [], { limit = 5, minSamples = 3 } = {}) => {
  const slots = buildNoShowRiskBySlot(visits).filter((s) => s.total >= minSamples)
  return [...slots]
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, limit)
}

/** Eng xavfli slotlar */
export const suggestRiskySlots = (visits = [], { limit = 5, minSamples = 2 } = {}) => {
  const slots = buildNoShowRiskBySlot(visits).filter((s) => s.total >= minSamples)
  return [...slots]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit)
}

export const calcPatientNoShowScore = (patientVisits = []) => {
  const relevant = patientVisits.filter((v) => {
    const s = String(v?.status || '').toLowerCase()
    return s && !CANCELLED.has(s) || s === 'no_show'
  })
  if (!relevant.length) return 0
  const noShows = relevant.filter((v) => String(v.status).toLowerCase() === 'no_show').length
  return Math.round((noShows / relevant.length) * 100)
}

export const buildSlotForecastSummary = (visits = []) => {
  const risky = suggestRiskySlots(visits, { limit: 3 })
  const best = suggestBestSlots(visits, { limit: 3 })
  const total = visits.filter((v) => {
    const s = String(v?.status || '').toLowerCase()
    return s && s !== 'cancelled'
  }).length
  const noShows = visits.filter((v) => String(v?.status || '').toLowerCase() === 'no_show').length

  return {
    totalVisits: total,
    noShowCount: noShows,
    noShowRate: total ? Math.round((noShows / total) * 1000) / 10 : 0,
    riskySlots: risky,
    bestSlots: best,
  }
}
