import { describe, expect, it } from 'vitest'
import {
  allocateRentShare,
  calculateVisitSettlement,
  summarizeSettlements,
  BILLING_MODELS,
  RENT_TYPES,
} from './soloBillingMath'

describe('allocateRentShare', () => {
  it('kunlik ijarani tashriflarga bo‘ladi', () => {
    expect(allocateRentShare({
      rentAmount: 100_000,
      rentType: RENT_TYPES.DAILY,
      visitsInPeriod: 4,
    })).toBe(25_000)
  })

  it('oylik ijarani kun va tashrifga proportsional qiladi', () => {
    const share = allocateRentShare({
      rentAmount: 3_000_000,
      rentType: RENT_TYPES.MONTHLY,
      visitsInPeriod: 2,
      daysInMonth: 30,
    })
    // 3_000_000 / 30 / 2 = 50_000
    expect(share).toBe(50_000)
  })
})

describe('calculateVisitSettlement', () => {
  it('foiz modelida xarajatdan keyin ulushlarni hisoblaydi', () => {
    const result = calculateVisitSettlement({
      grossRevenue: 1_000_000,
      expensesTotal: 200_000,
      settings: {
        model: BILLING_MODELS.PERCENTAGE,
        doctor_percentage: 40,
      },
    })
    expect(result.net_after_expenses).toBe(800_000)
    expect(result.doctor_share).toBe(320_000)
    expect(result.clinic_share).toBe(480_000)
    expect(result.rent_allocated).toBe(0)
  })

  it('ijara modelida proportsional ijara chegiradi', () => {
    const result = calculateVisitSettlement({
      grossRevenue: 500_000,
      expensesTotal: 0,
      visitsInPeriod: 2,
      daysInMonth: 30,
      settings: {
        model: BILLING_MODELS.RENT,
        rent_type: RENT_TYPES.DAILY,
        rent_amount: 100_000,
      },
    })
    expect(result.rent_allocated).toBe(50_000)
    expect(result.doctor_share).toBe(450_000)
    expect(result.clinic_share).toBe(50_000)
  })

  it('gibrid: ijara + qoldiqdan foiz', () => {
    const result = calculateVisitSettlement({
      grossRevenue: 1_000_000,
      expensesTotal: 100_000,
      visitsInPeriod: 1,
      settings: {
        model: BILLING_MODELS.HYBRID,
        doctor_percentage: 50,
        rent_type: RENT_TYPES.DAILY,
        rent_amount: 100_000,
      },
    })
    // net 900k - rent 100k = 800k → doctor 50% = 400k; clinic = 100k + 400k
    expect(result.rent_allocated).toBe(100_000)
    expect(result.doctor_share).toBe(400_000)
    expect(result.clinic_share).toBe(500_000)
  })
})

describe('summarizeSettlements', () => {
  it('yig‘indilarni to‘g‘ri yig‘adi', () => {
    const sum = summarizeSettlements([
      { gross_revenue: 100, expenses_total: 10, clinic_share: 40, rent_allocated: 0, doctor_share: 50 },
      { gross_revenue: 200, expenses_total: 20, clinic_share: 80, rent_allocated: 10, doctor_share: 100 },
    ])
    expect(sum.grossRevenue).toBe(300)
    expect(sum.expensesTotal).toBe(30)
    expect(sum.clinicShare).toBe(120)
    expect(sum.rentAllocated).toBe(10)
    expect(sum.doctorNet).toBe(150)
    expect(sum.visits).toBe(2)
  })
})
