/**
 * Daftar rasm → bemorlar JSON (Gemini / OpenAI GPT-4o vision).
 * Edge function va local dev proxy uchun umumiy mantiq.
 */

import {
  DENTAL_LEDGER_PROMPT,
  VISION_IMPORT_ROW_SCHEMA,
} from './visionImportSchema.js'

export const DENTAL_SCHEMA_PROMPT = DENTAL_LEDGER_PROMPT

export const extractJsonArray = (text) => {
  const trimmed = String(text || '').trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }
  throw new Error('JSON massiv topilmadi')
}

const detectProvider = ({ apiBase, model }) => {
  const base = String(apiBase || '').toLowerCase()
  const m = String(model || '').toLowerCase()
  if (base.includes('generativelanguage') || m.includes('gemini')) return 'gemini'
  if (base.includes('openai.com') || m.startsWith('gpt-')) return 'openai'
  return 'deepseek'
}

const parseGeminiError = (raw) => {
  try {
    const parsed = JSON.parse(raw)
    return parsed?.error?.message || raw.slice(0, 280)
  } catch {
    return raw.slice(0, 280) || 'Gemini Vision xatolik'
  }
}

const callGeminiVision = async ({ apiKey, model, imageBase64, mimeType }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const buildBody = (jsonMode) => ({
    systemInstruction: {
      parts: [{ text: DENTAL_SCHEMA_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Quyidagi stomatologik daftar/skan rasmidan barcha bemorlar qatorlarini JSON massiv qilib ajrating.' },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  })

  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(true)),
  })

  if (!response.ok && response.status === 400) {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBody(false)),
    })
  }

  if (!response.ok) {
    throw new Error(parseGeminiError(await response.text()))
  }

  const data = await response.json()
  const candidate = data?.candidates?.[0]
  const finishReason = candidate?.finishReason

  if (finishReason === 'SAFETY') {
    throw new Error('Rasm xavfsizlik filtri tufayli rad etildi. Boshqa surat yuklang.')
  }

  const parts = candidate?.content?.parts || []
  const text = parts.map((p) => p?.text || '').join('').trim()
  if (!text) {
    throw new Error('Gemini javob qaytarmadi. Surat sifatini yaxshilab qayta urinib ko\'ring.')
  }

  return text
}

const callOpenAICompatVision = async ({ apiKey, apiBase, model, imageBase64, mimeType, isOpenAI }) => {
  const base = String(apiBase).replace(/\/$/, '')
  const url = `${base}/v1/chat/completions`

  const userContent = isOpenAI
    ? [
        { type: 'text', text: 'Quyidagi stomatologik daftar/skandan barcha bemorlar va tashriflar ma\'lumotini JSON massiv qilib ajrating.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ]
    : `${DENTAL_SCHEMA_PROMPT}\n\nDaftar rasmi (${mimeType}). OCR qiling va bemorlar JSON massivini qaytaring.\n[IMAGE_BASE64_LENGTH=${imageBase64.length}]\n${imageBase64.slice(0, 8000)}`

  const body = {
    model,
    messages: [
      { role: 'system', content: DENTAL_SCHEMA_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  }

  if (isOpenAI) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'dental_ledger_import',
        strict: false,
        schema: {
          type: 'object',
          properties: {
            patients: {
              type: 'array',
              items: VISION_IMPORT_ROW_SCHEMA,
            },
          },
          required: ['patients'],
        },
      },
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err.slice(0, 300) || 'Vision API xatolik')
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || ''

  if (isOpenAI) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed.patients)) {
        return JSON.stringify(parsed.patients)
      }
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed)
      }
    } catch {
      // fallback extractJsonArray
    }
  }

  return content
}

export const callVisionLLM = async ({
  apiKey,
  apiBase = 'https://api.deepseek.com',
  model = 'deepseek-chat',
  imageBase64,
  mimeType = 'image/jpeg',
}) => {
  if (!apiKey) throw new Error('Vision API kaliti sozlanmagan')

  const provider = detectProvider({ apiBase, model })

  if (provider === 'gemini') {
    return callGeminiVision({ apiKey, model, imageBase64, mimeType })
  }

  if (provider === 'deepseek') {
    throw new Error(
      'DeepSeek chat modeli rasmni o\'qiy olmaydi. Gemini yoki OpenAI gpt-4o sozlang.'
    )
  }

  return callOpenAICompatVision({
    apiKey,
    apiBase,
    model,
    imageBase64,
    mimeType,
    isOpenAI: provider === 'openai',
  })
}

export const parseVisionImagePayload = async ({
  image_base64,
  mime_type = 'image/jpeg',
  apiKey,
  apiBase,
  model,
}) => {
  if (!image_base64 || String(image_base64).length < 100) {
    throw new Error('image_base64 majburiy')
  }

  const rawText = await callVisionLLM({
    apiKey,
    apiBase,
    model,
    imageBase64: image_base64,
    mimeType: mime_type,
  })

  let rows = []
  try {
    rows = extractJsonArray(rawText)
  } catch {
    throw new Error(
      'AI javobini tahlil qilib bo\'lmadi. Surat aniqroq yoki yorug\'roq bo\'lsin, yoki CSV/Excel import qiling.'
    )
  }

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(
      'Rasmdan bemor topilmadi. Jadval to\'liq ko\'rinsin, yorug\'lik yetarli bo\'lsin yoki CSV import qiling.'
    )
  }

  return { ok: true, rows, row_count: rows.length }
}
