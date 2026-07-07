/**
 * Daftar rasm → bemorlar JSON (DeepSeek / OpenAI vision).
 * Edge function va local dev proxy uchun umumiy mantiq.
 */

export const DENTAL_SCHEMA_PROMPT = `Siz stomatologik klinika daftarini o'qiydigan AI assistantsiz.
Rasm yoki skanerdagi bemorlar ro'yxatini JSON formatida qaytaring.

QOIDALAR:
- Faqat JSON massiv qaytaring, boshqa matn yo'q.
- Har bir element:
  {
    "full_name": "string",
    "phone": "string (+998...)",
    "birth_date": "YYYY-MM-DD yoki null",
    "last_visit": "YYYY-MM-DD yoki null",
    "notes": "string yoki null",
    "confidence": 0.0-1.0,
    "tooth_notes": [
      { "tooth_id": "FDI 11-48", "condition": "caries|filled|missing|crown|root_canal", "planned_service": "string", "note": "string" }
    ]
  }
- tooth_notes faqat aniq ko'rinadigan tish ma'lumotlari bo'lsa.
- O'qib bo'lmasa confidence past qo'ying.
- Telefonlarni +998 formatida normalizatsiya qiling.`

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
  if (base.includes('generativelanguage') || m.startsWith('gemini')) return 'gemini'
  if (base.includes('openai.com') || m.startsWith('gpt-')) return 'openai'
  return 'deepseek'
}

const callGeminiVision = async ({ apiKey, model, imageBase64, mimeType }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: DENTAL_SCHEMA_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Quyidagi daftar/skan rasmidan bemorlar ro\'yxatini JSON massiv qilib ajrating.' },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err.slice(0, 300) || 'Gemini Vision xatolik')
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts.map((p) => p?.text || '').join('')
}

const callOpenAICompatVision = async ({ apiKey, apiBase, model, imageBase64, mimeType, isOpenAI }) => {
  const base = String(apiBase).replace(/\/$/, '')
  const url = `${base}/v1/chat/completions`

  const userContent = isOpenAI
    ? [
        { type: 'text', text: 'Quyidagi daftar/skandan bemorlar ro\'yxatini ajrating.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ]
    : `${DENTAL_SCHEMA_PROMPT}\n\nDaftar rasmi (${mimeType}). OCR qiling va bemorlar JSON massivini qaytaring.\n[IMAGE_BASE64_LENGTH=${imageBase64.length}]\n${imageBase64.slice(0, 8000)}`

  const messages = [
    { role: 'system', content: DENTAL_SCHEMA_PROMPT },
    { role: 'user', content: userContent },
  ]

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err.slice(0, 300) || 'Vision API xatolik')
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
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
    rows = []
  }

  return { ok: true, rows, row_count: rows.length }
}
