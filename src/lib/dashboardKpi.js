/**
 * Dashboard KPI hisob-kitoblari
 */

const CANCELLED_STATUSES = new Set(['cancelled', 'no_show', 'canceled'])
const CONVERTED_LEAD_STATUSES = new Set(['booked', 'qabulda', 'converted'])

export const calcNoShowRate = (visits = []) => {
  const scheduledLike = visits.filter((v) => {
    const status = String(v?.status || '').toLowerCase()
    return status && status !== 'cancelled'
  })

  const base = scheduledLike.length
  if (!base) return { rate: 0, noShowCount: 0, total: 0 }

  const noShowCount = scheduledLike.filter(
    (v) => String(v?.status || '').toLowerCase() === 'no_show'
  ).length

  const rate = Math.round((noShowCount / base) * 1000) / 10
  return { rate, noShowCount, total: base }
}

export const calcLeadConversionRate = (leads = []) => {
  if (!leads.length) return { rate: 0, converted: 0, total: 0 }

  const converted = leads.filter((lead) =>
    CONVERTED_LEAD_STATUSES.has(String(lead?.status || '').toLowerCase())
  ).length

  const rate = Math.round((converted / leads.length) * 1000) / 10
  return { rate, converted, total: leads.length }
}

export const calcTotalDebt = (visits = []) => {
  let total = 0
  let debtorsCount = 0

  for (const visit of visits) {
    const debt = Number(visit?.debt_amount) || 0
    if (debt > 0) {
      total += debt
      debtorsCount += 1
    }
  }

  return { total, debtorsCount }
}

export const calcOccupancyRate = ({
  visits = [],
  doctors = [],
  slotMinutes = 60,
  dayStartMinutes = 8 * 60,
  dayEndMinutes = 20 * 60,
}) => {
  const activeDoctors = doctors.filter((d) => d?.is_active !== false)
  const doctorCount = activeDoctors.length || 1
  const totalMinutes = Math.max(slotMinutes, dayEndMinutes - dayStartMinutes)
  const slotsPerDoctor = Math.floor(totalMinutes / slotMinutes)
  const totalSlots = slotsPerDoctor * doctorCount

  if (!totalSlots) {
    return { rate: 0, bookedSlots: 0, totalSlots: 0, doctorCount }
  }

  const bookedVisits = visits.filter((v) => {
    const status = String(v?.status || '').toLowerCase()
    return status && !CANCELLED_STATUSES.has(status)
  })

  let bookedMinutes = 0
  for (const visit of bookedVisits) {
    const duration = Number(visit?.duration_minutes) || slotMinutes
    bookedMinutes += Math.max(slotMinutes, duration)
  }

  const bookedSlots = Math.ceil(bookedMinutes / slotMinutes)
  const rate = Math.min(100, Math.round((bookedSlots / totalSlots) * 1000) / 10)

  return {
    rate,
    bookedSlots,
    totalSlots,
    doctorCount,
  }
}

export const calcPerDoctorOccupancy = ({
  visits = [],
  doctors = [],
  slotMinutes = 60,
  dayStartMinutes = 8 * 60,
  dayEndMinutes = 20 * 60,
}) => {
  const totalMinutes = Math.max(slotMinutes, dayEndMinutes - dayStartMinutes)
  const slotsPerDoctor = Math.floor(totalMinutes / slotMinutes) || 1

  return doctors
    .filter((d) => d?.is_active !== false)
    .map((doctor) => {
      const docVisits = visits.filter((v) => {
        if (Number(v.doctor_id) !== Number(doctor.id)) return false
        const status = String(v?.status || '').toLowerCase()
        return status && !CANCELLED_STATUSES.has(status)
      })

      let minutes = 0
      for (const visit of docVisits) {
        minutes += Number(visit?.duration_minutes) || slotMinutes
      }

      const booked = Math.ceil(minutes / slotMinutes)
      const rate = Math.min(100, Math.round((booked / slotsPerDoctor) * 1000) / 10)

      return {
        doctorId: doctor.id,
        doctorName: doctor.full_name || `Shifokor #${doctor.id}`,
        bookedSlots: booked,
        totalSlots: slotsPerDoctor,
        rate,
      }
    })
    .sort((a, b) => b.rate - a.rate)
}
