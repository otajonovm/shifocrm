import { describe, expect, it } from 'vitest'
import {
  cashCollected,
  cashIncome,
  cashNetPaid,
  cashbackUsedTotal,
  discountTotal,
  earnBaseFromPayment,
  isDiscountEntry,
  lastPaymentAfterCashback,
  parseCashbackUsed,
  paymentDisplayAmount,
  servicesTotalDeduped,
  visitDueFrom,
  withCashbackUsedNote,
} from './paymentTotals'

describe('paymentTotals', () => {
  const rows = [
    { payment_type: 'payment', amount: 400000 },
    { payment_type: 'discount', amount: 50000 },
    { payment_type: 'refund', amount: 10000, note: '[DISCOUNT] aksiya' },
    { payment_type: 'refund', amount: 20000 },
  ]

  it('chegirmani to\'lov deb hisoblamaydi', () => {
    expect(isDiscountEntry({ payment_type: 'discount', amount: 1 })).toBe(true)
    expect(isDiscountEntry({ payment_type: 'refund', note: '[DISCOUNT] x' })).toBe(true)
    expect(isDiscountEntry({ payment_type: 'refund', amount: 1 })).toBe(false)
    expect(discountTotal(rows)).toBe(60000)
    expect(cashNetPaid(rows)).toBe(380000)
    expect(cashIncome(rows)).toBe(380000)
  })

  it('tish bo\'yicha oxirgi xizmatni oladi', () => {
    const total = servicesTotalDeduped([
      { tooth_id: 21, price: 100, created_at: '2026-01-01' },
      { tooth_id: 21, price: 400000, created_at: '2026-08-17' },
      { tooth_id: 24, price: 200000, created_at: '2026-08-17' },
    ])
    expect(total).toBe(600000)
  })

  it('qarz: xizmat − chegirma − to\'lov', () => {
    const ledger = visitDueFrom({
      services: [{ tooth_id: 11, price: 400000, created_at: '2026-08-17' }],
      visitPrice: 0,
      payments: [
        { payment_type: 'payment', amount: 100000 },
        { payment_type: 'discount', amount: 50000 },
      ],
    })
    expect(ledger.due).toBe(350000)
    expect(ledger.paid).toBe(100000)
    expect(ledger.remaining).toBe(250000)
  })

  it('keshbek earn bazasi cashback_used ni ayiradi', () => {
    const note = withCashbackUsedNote('To\'lov', 50000)
    expect(parseCashbackUsed({ note, amount: 400000 })).toBe(50000)
    expect(earnBaseFromPayment({ amount: 400000, note })).toBe(350000)
  })

  it('keshbek asosiy to\'lovdan ayiriladi, tashrif qarzida to\'langan hisoblanadi', () => {
    const payments = [
      { payment_type: 'payment', amount: 400000, cashback_used: 20000 },
    ]
    expect(cashbackUsedTotal(payments)).toBe(20000)
    expect(cashCollected(payments)).toBe(380000)
    expect(cashIncome(payments)).toBe(380000)
    expect(cashNetPaid(payments)).toBe(400000)
    expect(paymentDisplayAmount(payments[0])).toBe(380000)
    const ledger = visitDueFrom({
      services: [{ tooth_id: 11, price: 400000, created_at: '2026-08-18' }],
      payments,
    })
    expect(ledger.paid).toBe(400000)
    expect(ledger.remaining).toBe(0)
  })

  it('keshbekni ikki marta ayirmaydi: 400 000 − 20 000 = 380 000', () => {
    expect(lastPaymentAfterCashback({ amount: 400000, alreadyUsed: 0, additionalUsed: 20000 })).toEqual({
      cashback: 20000,
      remaining: 380000,
    })
    expect(lastPaymentAfterCashback({ amount: 400000, alreadyUsed: 20000, additionalUsed: 0 })).toEqual({
      cashback: 20000,
      remaining: 380000,
    })
    expect(lastPaymentAfterCashback({ amount: 400000, alreadyUsed: 20000, additionalUsed: 20000 })).toEqual({
      cashback: 40000,
      remaining: 360000,
    })
  })
})
