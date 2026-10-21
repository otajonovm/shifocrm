import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/supabaseConfig', () => ({
  supabaseGet: vi.fn(),
  supabasePatch: vi.fn(),
  supabaseDelete: vi.fn(),
}))

vi.mock('@/api/telegramApi', () => ({
  getTelegramApiBaseUrl: () => '/api/telegram',
  getTelegramApiHeaders: () => ({ 'Content-Type': 'application/json' }),
}))

import { validateDoctorBotInput } from './doctorBotsService'

describe('validateDoctorBotInput', () => {
  const base = {
    doctor_id: 12,
    bot_username: '@DrAliyev_Bot',
    bot_token: '123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    cashback_percent: 5,
    max_spend_percent: 30,
    referral_bonus: 20000,
  }

  it('accepts a complete payload', () => {
    expect(validateDoctorBotInput(base)).toBeNull()
  })

  it('requires a doctor and valid token on create', () => {
    expect(validateDoctorBotInput({ ...base, doctor_id: '' })).toBeTruthy()
    expect(validateDoctorBotInput({ ...base, bot_token: 'bad' })).toBeTruthy()
    expect(validateDoctorBotInput({ ...base, bot_username: 'x' })).toBeTruthy()
  })

  it('allows empty token on update', () => {
    expect(validateDoctorBotInput({ ...base, bot_token: '' }, { requireToken: false })).toBeNull()
  })
})
