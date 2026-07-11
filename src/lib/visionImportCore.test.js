import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractJsonArray, parseVisionImagePayload } from './visionImportCore'

describe('visionImportCore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('extractJsonArray parses array from mixed text', () => {
    const rows = extractJsonArray('Natija:\n[{"full_name":"Ali","phone":"+998901234567"}]\n')
    expect(rows).toHaveLength(1)
    expect(rows[0].full_name).toBe('Ali')
  })

  it('parseVisionImagePayload throws when image missing', async () => {
    await expect(parseVisionImagePayload({
      image_base64: 'short',
      apiKey: 'test',
      apiBase: 'https://generativelanguage.googleapis.com',
      model: 'gemini-flash-latest',
    })).rejects.toThrow(/image_base64/)
  })

  it('parseVisionImagePayload returns rows from Gemini JSON response', async () => {
    const imageBase64 = 'a'.repeat(120)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: '[{"full_name":"Malika Karimova","phone":"+998907654321","confidence":0.92}]',
            }],
          },
        }],
      }),
    })

    const result = await parseVisionImagePayload({
      image_base64: imageBase64,
      mime_type: 'image/jpeg',
      apiKey: 'test-key',
      apiBase: 'https://generativelanguage.googleapis.com',
      model: 'gemini-flash-latest',
    })

    expect(result.row_count).toBe(1)
    expect(result.rows[0].full_name).toBe('Malika Karimova')
  })

  it('parseVisionImagePayload throws when Gemini returns empty rows', async () => {
    const imageBase64 = 'a'.repeat(120)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: { parts: [{ text: '[]' }] },
        }],
      }),
    })

    await expect(parseVisionImagePayload({
      image_base64: imageBase64,
      mime_type: 'image/jpeg',
      apiKey: 'test-key',
      apiBase: 'https://generativelanguage.googleapis.com',
      model: 'gemini-flash-latest',
    })).rejects.toThrow(/topilmadi/)
  })
})
