/**
 * ShifoCRM ROI va moliyaviy samaradorlik hisoboti.
 */

import { listPayments } from '@/api/paymentsApi'
import { listVisits, getVisitsByDateRange } from '@/api/visitsApi'
import { listAppointments } from '@/api/appointmentsApi'
import { listLeadsByClinic } from '@/api/leadsApi'
import { listNotificationEvents } from '@/api/notificationEventsApi'
import { listDoctors } from '@/api/doctorsApi'
import { supabaseGet } from '@/api/supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { calcNoShowRate, calcLeadConversionRate } from '@/lib/dashboardKpi'
import {
  attributeLeadRecallRevenue,
  attributeAppointmentReminderRevenue,
  attributeFollowUpRevenue,
  sumAttributedFromEvents,
  buildMonthlyAttributedSeries,
  computeDoctorKpiTotal,
  computeDebtRecoveryRate,
  combineAttributedRevenue,
} from '@/lib/roiAttribution'

const monthKey = (date) => date.toISOString().slice(0, 7)

const buildMonthRange = (months) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startIso: start.toISOString(),
  }
}

const fetchScheduledMessagesSent = async () => {
  try {
    const rows = await supabaseGet(
      'scheduled_messages',
      'status=eq.sent&order=sent_at.desc&limit=500'
    )
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

const buildNoShowMonthlySeries = (visits, months = 6) => {
  const now = new Date()
  const series = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    series.push({
      month: key,
      label: d.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' }),
      rate: 0,
    })
  }

  const byMonth = new Map(series.map((row, idx) => [row.month, idx]))

  const grouped = new Map()
  for (const visit of visits) {
    const ref = visit.date || visit.created_at
    if (!ref) continue
    const key = String(ref).slice(0, 7)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(visit)
  }

  for (const [key, monthVisits] of grouped) {
    const idx = byMonth.get(key)
    if (idx == null) continue
    series[idx].rate = calcNoShowRate(monthVisits).rate
  }

  return series
}

const buildLeadConversionMonthlySeries = (leads, months = 6) => {
  const now = new Date()
  const series = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    series.push({
      month: key,
      label: d.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' }),
      rate: 0,
    })
  }

  const byMonth = new Map(series.map((row, idx) => [row.month, idx]))
  const grouped = new Map()

  for (const lead of leads) {
    const ref = lead.created_at || lead.appointment_time
    if (!ref) continue
    const key = String(ref).slice(0, 7)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(lead)
  }

  for (const [key, monthLeads] of grouped) {
    const idx = byMonth.get(key)
    if (idx == null) continue
    series[idx].rate = calcLeadConversionRate(monthLeads).rate
  }

  return series
}

export const getRoiImpactReport = async ({ months = 6 } = {}) => {
  const clinicId = await getCurrentClinicId()
  if (!clinicId) {
    return null
  }

  try {
    return await buildRoiImpactReport(clinicId, months)
  } catch (error) {
    console.error('ROI report build failed:', error)
    return buildEmptyRoiReport(clinicId, months)
  }
}

const buildEmptyRoiReport = (clinicId, months) => {
  const { startDate, endDate } = buildMonthRange(months)
  const monthlyAttributed = buildMonthlyAttributedSeries([], months)
  return {
    clinicId,
    period: { startDate, endDate, months },
    attributedRevenue: 0,
    attributedByType: {},
    monthlyAttributed,
    autoKpiTotal: 0,
    debtRecovery: { rate: 0, recovered: 0, total: 0 },
    noShowSeries: monthlyAttributed.map((m) => ({ month: m.month, label: m.label, rate: 0 })),
    leadConversionSeries: monthlyAttributed.map((m) => ({ month: m.month, label: m.label, rate: 0 })),
    noShowImprovement: 0,
    currentNoShow: 0,
    currentLeadConv: 0,
    breakdown: {
      leadRecall: { amount: 0, count: 0, visitIds: [] },
      appointmentReminder: { amount: 0, count: 0, visitIds: [] },
      followUp: { amount: 0, count: 0, visitIds: [] },
      fromEvents: 0,
    },
  }
}

const buildRoiImpactReport = async (clinicId, months) => {
  const { startDate, endDate, startIso } = buildMonthRange(months)

  const [
    payments,
    visits,
    appointments,
    leads,
    doctors,
    events,
    scheduledMessages,
  ] = await Promise.all([
    listPayments(`paid_at=gte.${startIso}&order=paid_at.desc&limit=5000`).catch(() => []),
    getVisitsByDateRange(startDate, endDate).catch(() => listVisits('order=date.desc&limit=2000').catch(() => [])),
    listAppointments(`scheduled_at=gte.${encodeURIComponent(startIso)}&order=scheduled_at.desc&limit=2000`).catch(() => []),
    listLeadsByClinic(clinicId).catch(() => []),
    listDoctors().catch(() => []),
    listNotificationEvents({ since: startIso, limit: 2000 }),
    fetchScheduledMessagesSent(),
  ])

  const paymentList = Array.isArray(payments) ? payments : []
  const visitList = Array.isArray(visits) ? visits : []
  const appointmentList = Array.isArray(appointments) ? appointments : []
  const leadList = Array.isArray(leads) ? leads : []
  const doctorList = Array.isArray(doctors) ? doctors : []
  const eventList = Array.isArray(events) ? events : []
  const messageList = Array.isArray(scheduledMessages) ? scheduledMessages : []

  const fromEvents = sumAttributedFromEvents(eventList)
  const leadRecall = attributeLeadRecallRevenue(leadList, visitList, paymentList)
  const appointmentReminder = attributeAppointmentReminderRevenue(appointmentList, visitList, paymentList)
  const followUp = attributeFollowUpRevenue(messageList, visitList, paymentList)

  const attributedRevenue = combineAttributedRevenue({
    fromEvents: fromEvents.total,
    leadRecall: leadRecall.amount,
    appointmentReminder: appointmentReminder.amount,
    followUp: followUp.amount,
  })

  const attributedByType = fromEvents.total > 0
    ? fromEvents.byType
    : {
        lead_2h_recall: leadRecall.amount,
        appointment_reminder: appointmentReminder.amount,
        follow_up: followUp.amount,
      }

  const monthlyAttributed = fromEvents.total > 0
    ? buildMonthlyAttributedSeries(eventList, months)
    : buildMonthlyAttributedSeries(
      eventList.length ? eventList : [
        ...leadList.filter((l) => l.reminder_2h_sent).map((l) => ({
          attributed_amount: 0,
          sent_at: l.appointment_time,
        })),
      ],
      months
    )

  if (fromEvents.total === 0 && attributedRevenue > 0) {
    const lastIdx = monthlyAttributed.length - 1
    if (lastIdx >= 0) {
      monthlyAttributed[lastIdx].amount = attributedRevenue
    }
  }

  const autoKpiTotal = computeDoctorKpiTotal(paymentList, doctorList)
  const debtRecovery = computeDebtRecoveryRate(visitList)
  const noShowSeries = buildNoShowMonthlySeries(visitList, months)
  const leadConversionSeries = buildLeadConversionMonthlySeries(leadList, months)

  const currentNoShow = noShowSeries[noShowSeries.length - 1]?.rate || 0
  const previousNoShow = noShowSeries[noShowSeries.length - 2]?.rate || currentNoShow
  const noShowImprovement = Math.round((previousNoShow - currentNoShow) * 10) / 10

  const currentLeadConv = leadConversionSeries[leadConversionSeries.length - 1]?.rate || 0

  return {
    clinicId,
    period: { startDate, endDate, months },
    attributedRevenue,
    attributedByType,
    monthlyAttributed,
    autoKpiTotal,
    debtRecovery,
    noShowSeries,
    leadConversionSeries,
    noShowImprovement,
    currentNoShow,
    currentLeadConv,
    breakdown: {
      leadRecall,
      appointmentReminder,
      followUp,
      fromEvents: fromEvents.total,
    },
  }
}
