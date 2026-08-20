import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applyPaymentCashback, getCashbackBalance } from './cashbackApi'
import {
  hasLocalCashbackTxn,
  getLocalCashbackBalanceRow,
  spendLocalCashback,
  syncLocalCashbackFromPayments,
} from '@/services/cashbackLedgerService'

vi.mock('./telegramApi', () => ({
  getTelegramApiBaseUrl: () => '/api/telegram',
  getTelegramApiHeaders: () => ({ 'Content-Type': 'application/json' }),
}))

vi.mock('@/services/cashbackLedgerService', () => ({
  getLocalCashbackBalance: vi.fn(async () => 0),
  getLocalCashbackBalanceRow: vi.fn(async () => null),
  earnLocalCashback: vi.fn(async () => ({ ok: false, earned: 0, error: 'LEDGER_SKIPPED' })),
  spendLocalCashback: vi.fn(async () => ({ ok: false, spent: 0, error: 'LEDGER_SKIPPED' })),
  syncLocalCashbackFromPayments: vi.fn(async () => ({ ok: true, earned: 0 })),
  hasLocalCashbackTxn: vi.fn(async () => false),
  recordLocalSpendMarker: vi.fn(async () => ({ ok: true, marker: true })),
}))

describe('applyPaymentCashback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    hasLocalCashbackTxn.mockResolvedValue(false)
    getLocalCashbackBalanceRow.mockResolvedValue(null)
    spendLocalCashback.mockResolvedValue({ ok: false, spent: 0, error: 'LEDGER_SKIPPED' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('spends then earns when both amounts are positive', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 100000,
      cashbackUsed: 20000,
    })

    expect(result.ok).toBe(true)
    expect(result.spent).toBe(20000)
    expect(result.earned).toBe(80000)
    expect(fetch).toHaveBeenCalledTimes(2)

    const [spendUrl, spendInit] = fetch.mock.calls[0]
    expect(spendUrl).toContain('/cashback/spend')
    expect(JSON.parse(spendInit.body)).toMatchObject({
      patient_id: '10',
      amount: 20000,
      payment_id: '99',
    })

    const [earnUrl, earnInit] = fetch.mock.calls[1]
    expect(earnUrl).toContain('/cashback/earn')
    expect(JSON.parse(earnInit.body)).toMatchObject({
      patient_id: '10',
      payment_amount: 80000,
      payment_id: '99',
    })
  })

  it('skips spend when cashbackUsed is 0', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 50000,
      cashbackUsed: 0,
    })

    expect(result.ok).toBe(true)
    expect(result.spent).toBe(0)
    expect(result.earned).toBe(50000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('/cashback/earn')
  })

  it('skips earn when remaining is 0', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 50000,
      cashbackUsed: 50000,
    })

    expect(result.ok).toBe(true)
    expect(result.spent).toBe(50000)
    expect(result.earned).toBe(0)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('/cashback/spend')
  })

  it('does not throw when fetch fails', async () => {
    fetch.mockRejectedValue(new Error('network down'))

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 40000,
      cashbackUsed: 10000,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.earned).toBe(0)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('/cashback/spend')
  })

  it('does not earn when spend fails', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'INSUFFICIENT_BALANCE' }),
    })

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 100000,
      cashbackUsed: 20000,
    })

    expect(result.ok).toBe(false)
    expect(result.earned).toBe(0)
    expect(fetch.mock.calls.every(([url]) => String(url).includes('/cashback/spend'))).toBe(true)
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/cashback/earn'))).toBe(false)
  })

  it('skips a second spend for the same payment', async () => {
    hasLocalCashbackTxn.mockResolvedValueOnce(true)

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 20000,
      cashbackUsed: 20000,
    })

    expect(result.ok).toBe(true)
    expect(result.duplicate).toBe(true)
    expect(result.spent).toBe(20000)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('spends from the local ledger when a balance row already exists', async () => {
    getLocalCashbackBalanceRow.mockResolvedValue({ balance: 50000 })
    spendLocalCashback.mockResolvedValue({ ok: true, spent: 20000 })

    const result = await applyPaymentCashback({
      patientId: 10,
      paymentId: 99,
      totalAmount: 20000,
      cashbackUsed: 20000,
    })

    expect(result.ok).toBe(true)
    expect(result.spent).toBe(20000)
    expect(fetch).not.toHaveBeenCalled()
    expect(spendLocalCashback).toHaveBeenCalledWith({
      patientId: 10,
      amount: 20000,
      paymentId: 99,
    })
  })
})

describe('getCashbackBalance', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    getLocalCashbackBalanceRow.mockResolvedValue(null)
    syncLocalCashbackFromPayments.mockResolvedValue({ ok: true, earned: 0 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns local ledger balance without waiting on the bot', async () => {
    getLocalCashbackBalanceRow.mockResolvedValue({ balance: 180000 })

    const result = await getCashbackBalance(42)

    expect(result.ok).toBe(true)
    expect(result.data.balance).toBe(180000)
    expect(result.data.source).toBe('ledger')
    expect(fetch).not.toHaveBeenCalled()
    expect(syncLocalCashbackFromPayments).not.toHaveBeenCalled()
  })
})
