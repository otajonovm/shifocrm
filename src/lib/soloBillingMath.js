/**
 * Solo shifokor moliyaviy hisob-kitob (sof funksiyalar).
 * model: percentage | rent | hybrid
 */

export const BILLING_MODELS = Object.freeze({
  PERCENTAGE: 'percentage',
  RENT: 'rent',
  HYBRID: 'hybrid',
})

export const RENT_TYPES = Object.freeze({
  DAILY: 'daily',
  MONTHLY: 'monthly',
})

export const EXPENSE_CATEGORIES = Object.freeze({
  ZUBOTEXNIK: 'zubotexnik',
  LAB: 'lab',
  MATERIAL: 'material',
  OTHER: 'other',
})

export const DEFAULT_BILLING_SETTINGS = Object.freeze({
  model: BILLING_MODELS.PERCENTAGE,
  doctor_percentage: 40,
  rent_type: RENT_TYPES.MONTHLY,
  rent_amount: 0,
})

const toNum = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const clampPct = (value) => Math.min(100, Math.max(0, toNum(value)))

/**
 * Kunlik/oylik ijara summasidan bitta tashrifga proportsional ulush.
 * @param {object} opts
 * @param {number} opts.rentAmount
 * @param {'daily'|'monthly'} opts.rentType
 * @param {number} opts.visitsInPeriod — shu kun yoki oy ichidagi tashriflar soni
 * @param {number} [opts.daysInMonth] — oylik uchun (default 30)
 */
export function allocateRentShare({
  rentAmount,
  rentType = RENT_TYPES.MONTHLY,
  visitsInPeriod = 1,
  daysInMonth = 30,
}) {
  const amount = Math.max(0, toNum(rentAmount))
  const visits = Math.max(1, Math.floor(toNum(visitsInPeriod)) || 1)
  if (amount <= 0) return 0

  if (rentType === RENT_TYPES.DAILY) {
    return amount / visits
  }

  // monthly: oy summasini kunlarga, keyin kun ichidagi tashriflarga
  const perDay = amount / Math.max(1, toNum(daysInMonth) || 30)
  return perDay / visits
}

/**
 * Bitta tashrif uchun hisob-kitob.
 * @param {object} input
 * @param {number} input.grossRevenue — tashrif sof tushumi (to'lovlar net)
 * @param {number} input.expensesTotal — zubotexnik + material + boshqa
 * @param {object} input.settings — doctor_billing_settings
 * @param {number} [input.visitsInPeriod]
 * @param {number} [input.daysInMonth]
 */
export function calculateVisitSettlement({
  grossRevenue = 0,
  expensesTotal = 0,
  settings = DEFAULT_BILLING_SETTINGS,
  visitsInPeriod = 1,
  daysInMonth = 30,
}) {
  const gross = Math.max(0, toNum(grossRevenue))
  const expenses = Math.max(0, toNum(expensesTotal))
  const netAfterExpenses = Math.max(0, gross - expenses)

  const model = settings?.model || BILLING_MODELS.PERCENTAGE
  const doctorPct = clampPct(settings?.doctor_percentage ?? 40)
  const rentType = settings?.rent_type || RENT_TYPES.MONTHLY
  const rentAmount = Math.max(0, toNum(settings?.rent_amount))

  let rentAllocated = 0
  let doctorShare = 0
  let clinicShare = 0

  if (model === BILLING_MODELS.PERCENTAGE) {
    doctorShare = (netAfterExpenses * doctorPct) / 100
    clinicShare = netAfterExpenses - doctorShare
  } else if (model === BILLING_MODELS.RENT) {
    rentAllocated = allocateRentShare({
      rentAmount,
      rentType,
      visitsInPeriod,
      daysInMonth,
    })
    // Ijara sof tushumdan chegiriladi; qolgani shifokorniki
    const afterRent = Math.max(0, netAfterExpenses - rentAllocated)
    doctorShare = afterRent
    clinicShare = Math.min(rentAllocated, netAfterExpenses)
    rentAllocated = clinicShare
  } else {
    // hybrid: avval ijara, keyin qoldiqdan foiz
    rentAllocated = allocateRentShare({
      rentAmount,
      rentType,
      visitsInPeriod,
      daysInMonth,
    })
    const cappedRent = Math.min(rentAllocated, netAfterExpenses)
    const afterRent = Math.max(0, netAfterExpenses - cappedRent)
    doctorShare = (afterRent * doctorPct) / 100
    clinicShare = cappedRent + (afterRent - doctorShare)
    rentAllocated = cappedRent
  }

  return {
    model,
    gross_revenue: roundMoney(gross),
    expenses_total: roundMoney(expenses),
    net_after_expenses: roundMoney(netAfterExpenses),
    doctor_share: roundMoney(doctorShare),
    clinic_share: roundMoney(clinicShare),
    rent_allocated: roundMoney(rentAllocated),
    doctor_percentage: doctorPct,
  }
}

export function roundMoney(value) {
  return Math.round((toNum(value) + Number.EPSILON) * 100) / 100
}

/**
 * Davr bo'yicha yig'indi (hisobot).
 */
export function summarizeSettlements(settlements = []) {
  const list = Array.isArray(settlements) ? settlements : []
  return list.reduce(
    (acc, row) => {
      acc.grossRevenue += toNum(row.gross_revenue)
      acc.expensesTotal += toNum(row.expenses_total)
      acc.clinicShare += toNum(row.clinic_share)
      acc.rentAllocated += toNum(row.rent_allocated)
      acc.doctorNet += toNum(row.doctor_share)
      acc.visits += 1
      return acc
    },
    {
      grossRevenue: 0,
      expensesTotal: 0,
      clinicShare: 0,
      rentAllocated: 0,
      doctorNet: 0,
      visits: 0,
    },
  )
}

export function daysInMonthOf(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike)
  if (Number.isNaN(d.getTime())) return 30
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function toDateKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toMonthKey(dateLike) {
  return toDateKey(dateLike).slice(0, 7)
}
