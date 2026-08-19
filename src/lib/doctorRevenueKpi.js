/**
 * Shifokor KPI: distinct visit, net collected (payment − refund), discount alohida.
 */

import { earnBaseFromPayment, isDiscountEntry, isTrueRefund } from '@/lib/paymentTotals'

export function buildDoctorRevenueRows({ payments = [], doctors = [] } = {}) {
  const map = new Map()

  const ensureRow = (doctorId) => {
    const key = doctorId != null ? Number(doctorId) : 'none'
    if (!map.has(key)) {
      const doctor = doctorId != null
        ? doctors.find((d) => Number(d.id) === Number(doctorId))
        : null
      const pct = doctor && doctor.salary_percentage != null
        ? Number(doctor.salary_percentage)
        : 0
      map.set(key, {
        doctorId: doctorId != null ? Number(doctorId) : null,
        name: doctor
          ? (doctor.full_name || doctor.name || `#${doctorId}`)
          : 'Biriktirilmagan',
        salaryPercentage: Number.isFinite(pct) ? pct : 0,
        gross: 0,
        visitIds: new Set(),
        orthodonticVisitIds: new Set(),
      })
    }
    return map.get(key)
  }

  for (const p of payments) {
    if (isDiscountEntry(p)) continue
    if (p.payment_type !== 'payment' && !isTrueRefund(p)) continue
    const row = ensureRow(p.doctor_id)
    const amount = Number(p.amount) || 0
    if (isTrueRefund(p)) {
      row.gross -= Math.abs(amount)
    } else {
      row.gross += earnBaseFromPayment(p)
      if (p.visit_id != null) {
        row.visitIds.add(Number(p.visit_id))
        const svc = String(p.service_name || p.note || '').toLowerCase()
        if (svc.includes('orto') || svc.includes('breket') || svc.includes('brace')) {
          row.orthodonticVisitIds.add(Number(p.visit_id))
        }
      }
    }
  }

  return Array.from(map.values())
    .map((row) => {
      const gross = Math.max(0, row.gross)
      const visitsCount = row.visitIds.size
      const orthodonticCount = row.orthodonticVisitIds.size
      const orthodonticPercent = visitsCount > 0
        ? Math.round((orthodonticCount / visitsCount) * 1000) / 10
        : 0
      const doctorShare = Math.round((gross * row.salaryPercentage) / 100)
      const clinicShare = gross - doctorShare
      return {
        doctorId: row.doctorId,
        name: row.name,
        salaryPercentage: row.salaryPercentage,
        gross,
        visitsCount,
        orthodonticPercent,
        doctorShare,
        clinicShare,
      }
    })
    .filter((row) => row.gross !== 0 || row.visitsCount > 0)
    .sort((a, b) => b.gross - a.gross)
}

export function summarizeDoctorRevenueRows(rows = []) {
  return rows.reduce(
    (acc, row) => {
      acc.gross += row.gross
      acc.doctorShare += row.doctorShare
      acc.clinicShare += row.clinicShare
      acc.visitsCount += row.visitsCount
      return acc
    },
    { gross: 0, doctorShare: 0, clinicShare: 0, visitsCount: 0 },
  )
}
