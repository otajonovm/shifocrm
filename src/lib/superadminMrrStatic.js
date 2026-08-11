/**
 * Superadmin MRR paneli — klinikalar va yakka stomlar hisobi.
 * Tarif: 150 000 so'm / odam (oyiga).
 */

export const MRR_UNIT_PRICE = 150_000

/** 27 yakka stom: 17 tasi to'lovchi */
export const SOLO_TOTAL = 27
export const SOLO_PAID = 17

/**
 * 5 klinika:
 * 3 tasi to'lovchi (5 / 4 / 6 odam), 2 tasi sinovda.
 */
export const CLINIC_ROWS = [
  { id: 'yunusobod', name: 'Yunusobot', seats: 5, status: 'paid' },
  { id: 'vipdent', name: 'Vipdent', seats: 4, status: 'paid' },
  { id: 'smile-avenue', name: 'Smile Avenue', seats: 6, status: 'paid' },
  { id: 'dent-family', name: 'Dent Family', seats: 0, status: 'trial' },
  { id: 'dent', name: 'Dent', seats: 0, status: 'trial' },
]

export function formatSom(amount) {
  const n = Number(amount) || 0
  return `${n.toLocaleString('uz-UZ')} so'm`
}

export function buildMrrPanel() {
  const unitPrice = MRR_UNIT_PRICE

  const soloPaid = SOLO_PAID
  const soloTotal = SOLO_TOTAL
  const soloUnpaid = soloTotal - soloPaid
  const soloMrr = soloPaid * unitPrice

  const clinics = CLINIC_ROWS.map((row) => {
    const seats = row.status === 'paid' ? Number(row.seats) || 0 : 0
    const mrr = seats * unitPrice
    return {
      id: row.id,
      name: row.name,
      seats: row.status === 'paid' ? seats : null,
      status: row.status,
      mrr,
    }
  })

  const paidClinics = clinics.filter((c) => c.status === 'paid')
  const trialClinics = clinics.filter((c) => c.status === 'trial')
  const clinicsMrr = paidClinics.reduce((sum, c) => sum + c.mrr, 0)
  const paidClinicSeats = paidClinics.reduce((sum, c) => sum + (c.seats || 0), 0)
  const currentMrr = clinicsMrr + soloMrr

  return {
    unitPrice,
    soloTotal,
    soloPaid,
    soloUnpaid,
    soloMrr,
    clinics,
    paidClinicsCount: paidClinics.length,
    trialClinicsCount: trialClinics.length,
    clinicsTotal: clinics.length,
    paidClinicSeats,
    clinicsMrr,
    currentMrr,
  }
}
