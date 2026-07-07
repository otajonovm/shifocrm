/**
 * ROI attribution — eslatmalar orqali keltirilgan daromad hisob-kitoblari.
 */

const COMPLETED_VISIT_STATUSES = new Set([
  'arrived',
  'in_progress',
  'completed_paid',
  'completed_debt',
])

const CONFIRMED_LEAD_STATUSES = new Set(['confirmed', 'booked', 'qabulda', 'converted'])

export const sumPaymentsForVisitIds = (visitIds, payments = []) => {
  const idSet = new Set((visitIds || []).map((id) => Number(id)))
  let total = 0

  for (const payment of payments) {
    if (payment?.payment_type === 'refund') continue
    const vid = Number(payment?.visit_id)
    if (!idSet.has(vid)) continue
    total += Number(payment?.amount) || 0
  }

  return total
}

export const attributeLeadRecallRevenue = (leads = [], visits = [], payments = []) => {
  const visitByLead = new Map()
  for (const visit of visits) {
    if (visit?.lead_id != null) {
      visitByLead.set(Number(visit.lead_id), visit)
    }
  }

  const visitIds = []
  for (const lead of leads) {
    if (!lead?.reminder_2h_sent) continue
    const status = String(lead.status || '').toLowerCase()
    if (!CONFIRMED_LEAD_STATUSES.has(status)) continue
    const visit = visitByLead.get(Number(lead.id))
    if (visit?.id) visitIds.push(visit.id)
  }

  return {
    amount: sumPaymentsForVisitIds(visitIds, payments),
    visitIds,
    count: visitIds.length,
  }
}

export const attributeAppointmentReminderRevenue = (appointments = [], visits = [], payments = []) => {
  const visitByAppointment = new Map()
  for (const visit of visits) {
    if (visit?.appointment_id != null) {
      visitByAppointment.set(Number(visit.appointment_id), visit)
    }
  }

  const visitIds = []
  for (const apt of appointments) {
    if (!apt?.reminder_24h_sent && !apt?.reminder_1h_sent) continue
    const visit = visitByAppointment.get(Number(apt.id))
    if (!visit?.id) continue
    const status = String(visit.status || '').toLowerCase()
    if (!COMPLETED_VISIT_STATUSES.has(status)) continue
    visitIds.push(visit.id)
  }

  return {
    amount: sumPaymentsForVisitIds(visitIds, payments),
    visitIds,
    count: visitIds.length,
  }
}

export const attributeFollowUpRevenue = (
  scheduledMessages = [],
  visits = [],
  payments = [],
  windowDays = 30
) => {
  const windowMs = windowDays * 24 * 60 * 60 * 1000
  const visitIds = new Set()

  const sentMessages = scheduledMessages.filter(
    (m) => String(m?.status || '').toLowerCase() === 'sent' && m?.sent_at
  )

  for (const msg of sentMessages) {
    const patientId = Number(msg.patient_id)
    const sentAt = new Date(msg.sent_at).getTime()
    if (!Number.isFinite(patientId) || !Number.isFinite(sentAt)) continue

    for (const visit of visits) {
      if (Number(visit?.patient_id) !== patientId) continue
      const createdAt = new Date(visit.created_at || visit.date).getTime()
      if (!Number.isFinite(createdAt) || createdAt <= sentAt) continue
      if (createdAt - sentAt > windowMs) continue
      const status = String(visit.status || '').toLowerCase()
      if (!COMPLETED_VISIT_STATUSES.has(status)) continue
      visitIds.add(visit.id)
    }
  }

  const ids = Array.from(visitIds)
  return {
    amount: sumPaymentsForVisitIds(ids, payments),
    visitIds: ids,
    count: ids.length,
  }
}

export const sumAttributedFromEvents = (events = []) => {
  let total = 0
  const byType = {}

  for (const event of events) {
    const amt = Number(event?.attributed_amount) || 0
    if (amt <= 0) continue
    total += amt
    const type = event.event_type || 'other'
    byType[type] = (byType[type] || 0) + amt
  }

  return { total, byType }
}

export const buildMonthlyAttributedSeries = (events = [], months = 6) => {
  const now = new Date()
  const series = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    series.push({ month: key, label: d.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' }), amount: 0 })
  }

  const indexByMonth = new Map(series.map((row, idx) => [row.month, idx]))

  for (const event of events) {
    const amt = Number(event?.attributed_amount) || 0
    if (amt <= 0) continue
    const ref = event.attributed_at || event.sent_at
    if (!ref) continue
    const key = String(ref).slice(0, 7)
    const idx = indexByMonth.get(key)
    if (idx == null) continue
    series[idx].amount += amt
  }

  return series
}

export const computeDoctorKpiTotal = (payments = [], doctors = []) => {
  const pctByDoctor = new Map()
  for (const doc of doctors) {
    const pct = doc?.salary_percentage != null ? Number(doc.salary_percentage) : 0
    pctByDoctor.set(Number(doc.id), Number.isFinite(pct) ? pct : 0)
  }

  let total = 0
  for (const payment of payments) {
    if (payment?.payment_type === 'refund') continue
    const doctorId = Number(payment?.doctor_id)
    const pct = pctByDoctor.get(doctorId) || 0
    const amt = Number(payment?.amount) || 0
    total += Math.round((amt * pct) / 100)
  }

  return total
}

export const computeDebtRecoveryRate = (visits = []) => {
  const debtVisits = visits.filter((v) => String(v?.status || '').toLowerCase() === 'completed_debt')
  if (!debtVisits.length) return { rate: 0, recovered: 0, total: 0 }

  const recovered = debtVisits.filter((v) => {
    const paid = Number(v?.paid_amount) || 0
    const price = Number(v?.price) || 0
    return paid > 0 && paid >= price
  }).length

  const rate = Math.round((recovered / debtVisits.length) * 1000) / 10
  return { rate, recovered, total: debtVisits.length }
}

export const combineAttributedRevenue = ({
  fromEvents = 0,
  leadRecall = 0,
  appointmentReminder = 0,
  followUp = 0,
}) => {
  if (fromEvents > 0) return fromEvents
  return leadRecall + appointmentReminder + followUp
}
