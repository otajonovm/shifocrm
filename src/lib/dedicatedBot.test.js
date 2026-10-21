import { describe, expect, it } from 'vitest'
import {
  clampPercent,
  earnAmountFromPercent,
  formatDedicatedCashbackNotify,
  isValidBotToken,
  isValidBotUsername,
  maskBotToken,
  maxSpendableCashback,
  normalizeBotUsername,
  parseReferralStartPayload,
  usernamesMatch,
} from './dedicatedBot'

describe('dedicatedBot helpers', () => {
  it('normalizes and validates bot username', () => {
    expect(normalizeBotUsername('DrAliyev_Bot')).toBe('@DrAliyev_Bot')
    expect(normalizeBotUsername('@DrAliyev_Bot')).toBe('@DrAliyev_Bot')
    expect(isValidBotUsername('@DrAliyev_Bot')).toBe(true)
    expect(isValidBotUsername('ab')).toBe(false)
  })

  it('validates BotFather token shape', () => {
    expect(isValidBotToken('123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true)
    expect(isValidBotToken('not-a-token')).toBe(false)
  })

  it('parses referral deep links', () => {
    expect(parseReferralStartPayload('/start ref_42')).toEqual({
      payload: 'ref_42',
      referrerPatientId: 42,
    })
    expect(parseReferralStartPayload('/start@MyBot ref-9')).toEqual({
      payload: 'ref-9',
      referrerPatientId: 9,
    })
    expect(parseReferralStartPayload('/start')).toEqual({
      payload: '',
      referrerPatientId: null,
    })
  })

  it('caps cashback spend by max_spend_percent', () => {
    expect(maxSpendableCashback({
      paymentAmount: 100000,
      balance: 80000,
      maxSpendPercent: 30,
    })).toBe(30000)
    expect(maxSpendableCashback({
      paymentAmount: 100000,
      balance: 10000,
      maxSpendPercent: 30,
    })).toBe(10000)
    expect(maxSpendableCashback({
      paymentAmount: 100000,
      balance: 80000,
      maxSpendPercent: null,
    })).toBe(80000)
  })

  it('formats dedicated cashback notify copy without ShifoCRM', () => {
    const text = formatDedicatedCashbackNotify({
      doctorName: 'Aliyev',
      earnedAmount: 25000,
    })
    expect(text).toContain('Dr. Aliyev')
    expect(text).toContain('25 000')
    expect(text.toLowerCase()).not.toContain('shifocrm')
  })

  it('computes earn amount and compares usernames', () => {
    expect(earnAmountFromPercent(200000, 5)).toBe(10000)
    expect(clampPercent(140, 5)).toBe(100)
    expect(usernamesMatch('@DrAliyev_Bot', 'DrAliyev_Bot')).toBe(true)
    expect(maskBotToken('1234')).toBe('••••1234')
  })
})
