import { describe, expect, it, vi } from 'vitest'
import {
  isSchemaCacheColumnError,
  parseMissingColumn,
  writeOmittingMissingColumns,
} from './supabaseSchemaFallback'

describe('supabaseSchemaFallback', () => {
  it('detects PostgREST schema-cache column errors', () => {
    expect(isSchemaCacheColumnError({ code: 'PGRST204' })).toBe(true)
    expect(isSchemaCacheColumnError({ code: '42703' })).toBe(true)
    expect(isSchemaCacheColumnError({
      message: "Could not find the 'bot_token' column of 'doctor_dedicated_bots' in the schema cache",
    })).toBe(true)
    expect(isSchemaCacheColumnError({ message: 'column foo does not exist' })).toBe(true)
    expect(isSchemaCacheColumnError({ message: 'permission denied' })).toBe(false)
  })

  it('parses missing column names from error text', () => {
    expect(parseMissingColumn({
      message: "Could not find the 'webhook_secret' column of 'doctor_dedicated_bots' in the schema cache",
    })).toBe('webhook_secret')
    expect(parseMissingColumn({
      message: 'column "cashback_percent" of relation doctor_dedicated_bots does not exist',
    })).toBe('cashback_percent')
    expect(parseMissingColumn({
      message: 'column referral_bonus does not exist',
    })).toBe('referral_bonus')
    expect(parseMissingColumn({ message: 'other error' })).toBe(null)
  })

  it('retries writes after dropping the missing column', async () => {
    const writeFn = vi.fn()
      .mockRejectedValueOnce({
        code: 'PGRST204',
        message: "Could not find the 'bot_token' column of 'doctor_dedicated_bots' in the schema cache",
      })
      .mockResolvedValueOnce({ id: 1 })

    const result = await writeOmittingMissingColumns(writeFn, {
      doctor_id: 7,
      bot_token: 'secret',
      title: 'Cashback',
    })

    expect(result).toEqual({ id: 1 })
    expect(writeFn).toHaveBeenCalledTimes(2)
    expect(writeFn.mock.calls[1][0]).toEqual({
      doctor_id: 7,
      title: 'Cashback',
    })
  })

  it('maps a missing column onto an alias on retry', async () => {
    const writeFn = vi.fn()
      .mockRejectedValueOnce({
        code: 'PGRST204',
        message: "Could not find the 'bot_token' column of 'doctor_dedicated_bots' in the schema cache",
      })
      .mockResolvedValueOnce({ id: 2 })

    await writeOmittingMissingColumns(writeFn, {
      bot_token: 'secret',
    }, { aliases: { bot_token: ['token'] } })

    expect(writeFn.mock.calls[1][0]).toEqual({ token: 'secret' })
  })
})
