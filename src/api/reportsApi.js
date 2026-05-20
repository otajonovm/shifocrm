import { getVisitsByDate, getDebtVisits } from './visitsApi'
import { getPaymentsByDateRange } from './paymentsApi'
import { listPatients } from './patientsApi'
import { getTodayISO } from '@/lib/date'

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getLocalDayRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export async function getSoloSummary(doctorId, clinicId = null) {
  const today = getTodayISO()
  const now = new Date()
  // Visits today
  let visits = []
  try {
    visits = await getVisitsByDate(today)
  } catch (err) {
    visits = []
  }

  // Filter visits belonging to this doctor (best-effort)
  const doctorVisits = visits.filter(v => Number(v.doctor_id) === Number(doctorId) || Number(v.assigned_doctor_id || v.doctor_id) === Number(doctorId))

  const todayVisitsCount = doctorVisits.length

  // Next patient (closest future pending/arrived visit)
  const nextStatuses = ['pending', 'arrived']
  const upcoming = doctorVisits
    .filter(v => nextStatuses.includes(v.status))
    .sort((a, b) => new Date(a.start_time || a.created_at) - new Date(b.start_time || b.created_at))
  const nextPatient = upcoming.length ? { id: upcoming[0].patient_id, name: upcoming[0].patient_name || `#${upcoming[0].patient_id}`, time: upcoming[0].start_time || upcoming[0].created_at } : null

  // Today's revenue
  let dailyRevenue = 0
  try {
    const { startISO, endISO } = getLocalDayRange(now)
    const dayPay = await getPaymentsByDateRange(startISO, endISO)
    // Sum amounts (best-effort)
    dailyRevenue = (dayPay || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)
  } catch (err) {
    dailyRevenue = 0
  }

  // New patients in last 7 days
  let newPatientsCount = 0
  try {
    const patients = await listPatients()
    const weekAgo = addDays(now, -7)
    newPatientsCount = (patients || []).filter(p => new Date(p.created_at || 0) >= weekAgo && (Number(p.doctor_id) === Number(doctorId) || !p.doctor_id)).length
  } catch {
    newPatientsCount = 0
  }

  // Top 3 debtors (aggregate by patient)
  let topDebtors = []
  try {
    const debtVisits = await getDebtVisits()
    const byPatient = new Map()
    debtVisits.forEach(v => {
      // associate only debts related to this doctor where possible
      const belongsToDoctor = Number(v.doctor_id) === Number(doctorId) || false
      if (!belongsToDoctor && v.patient && Number(v.patient.doctor_id) !== Number(doctorId)) return
      const raw = v.debt_amount ?? (Number(v.price || 0) - Number(v.paid_amount || 0))
      const debt = Number.isNaN(Number(raw)) ? 0 : Number(raw)
      if (debt <= 0) return
      const pid = Number(v.patient_id)
      byPatient.set(pid, (byPatient.get(pid) || 0) + debt)
    })
    topDebtors = Array.from(byPatient.entries())
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
  } catch (err) {
    topDebtors = []
  }

  return {
    todayVisitsCount,
    todayVisits: doctorVisits,
    dailyRevenue,
    nextPatient,
    newPatientsCount,
    topDebtors,
  }
}

export default { getSoloSummary }
