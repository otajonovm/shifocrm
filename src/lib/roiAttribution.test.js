import { describe, it, expect } from 'vitest'
import {
  sumPaymentsForVisitIds,
  attributeLeadRecallRevenue,
  attributeAppointmentReminderRevenue,
  combineAttributedRevenue,
  computeDoctorKpiTotal,
} from '@/lib/roiAttribution'

describe('roiAttribution', () => {
  const payments = [
    { visit_id: 1, amount: 500000, payment_type: 'payment', doctor_id: 10 },
    { visit_id: 2, amount: 300000, payment_type: 'payment', doctor_id: 10 },
    { visit_id: 3, amount: 100000, payment_type: 'refund', doctor_id: 10 },
  ]

  it('sumPaymentsForVisitIds excludes refunds', () => {
    expect(sumPaymentsForVisitIds([1, 2, 3], payments)).toBe(800000)
  })

  it('attributes lead recall revenue for confirmed leads with reminders', () => {
    const leads = [
      { id: 5, status: 'confirmed', reminder_2h_sent: true },
    ]
    const visits = [
      { id: 1, lead_id: 5, status: 'completed_paid' },
    ]
    const result = attributeLeadRecallRevenue(leads, visits, payments)
    expect(result.amount).toBe(500000)
    expect(result.count).toBe(1)
  })

  it('attributes appointment reminder revenue', () => {
    const appointments = [
      { id: 100, reminder_24h_sent: true },
    ]
    const visits = [
      { id: 2, appointment_id: 100, status: 'arrived' },
    ]
    const result = attributeAppointmentReminderRevenue(appointments, visits, payments)
    expect(result.amount).toBe(300000)
  })

  it('combineAttributedRevenue prefers event totals', () => {
    expect(combineAttributedRevenue({
      fromEvents: 1000,
      leadRecall: 500,
      appointmentReminder: 200,
      followUp: 100,
    })).toBe(1000)

    expect(combineAttributedRevenue({
      fromEvents: 0,
      leadRecall: 500,
      appointmentReminder: 200,
      followUp: 100,
    })).toBe(800)
  })

  it('computeDoctorKpiTotal applies salary percentage', () => {
    const doctors = [{ id: 10, salary_percentage: 40 }]
    const total = computeDoctorKpiTotal(payments, doctors)
    expect(total).toBe(Math.round((500000 + 300000) * 40 / 100))
  })
})
