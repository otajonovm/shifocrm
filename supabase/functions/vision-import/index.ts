/**
 * Vision import — daftar rasmini structured JSON ga aylantirish.
 *
 * Env (Supabase Edge Function secrets):
 * - VISION_API_KEY yoki DEEPSEEK_API_KEY
 * - VISION_API_BASE (default: https://api.deepseek.com)
 * - VISION_MODEL (default: deepseek-chat — vision uchun OpenAI gpt-4o ham bo'ladi)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const DENTAL_SCHEMA_PROMPT = `Siz stomatologik klinika daftarini o'qiydigan AI assistantsiz.
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

async function callVisionLLM({ apiKey, apiBase, model, imageBase64, mimeType }) {
  const isOpenAI = apiBase.includes('openai.com')
  const url = isOpenAI
    ? `${apiBase.replace(/\/$/, '')}/v1/chat/completions`
    : `${apiBase.replace(/\/$/, '')}/v1/chat/completions`

  const userContent = isOpenAI
    ? [
        { type: 'text', text: 'Quyidagi daftar/skantdan bemorlar ro\'yxatini ajrating.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ]
    : `Daftar rasmi base64 (${mimeType}). OCR qiling va bemorlar JSON massivini qaytaring.\n\n[IMAGE_BASE64_LENGTH=${imageBase64.length}]`

  const messages = [
    { role: 'system', content: DENTAL_SCHEMA_PROMPT },
    { role: 'user', content: userContent },
  ]

  const body = {
    model,
    messages,
    temperature: 0.1,
    max_tokens: 4000,
  }

  if (!isOpenAI && imageBase64) {
    body.messages[1].content = `${DENTAL_SCHEMA_PROMPT}\n\nRasm base64 (qisqartirilgan OCR simulyatsiyasi — agar vision qo'llab-quvvatlanmasa, matnni o'qing):\n${imageBase64.slice(0, 500)}...`
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
  const text = data?.choices?.[0]?.message?.content || ''
  return text
}

function extractJsonArray(text) {
  const trimmed = String(text || '').trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }
  throw new Error('JSON massiv topilmadi')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405)
  }

  try {
    const { image_base64, mime_type = 'image/jpeg', clinic_id } = await req.json()

    if (!image_base64 || String(image_base64).length < 100) {
      return json({ error: 'image_base64 majburiy' }, 400)
    }

    const apiKey = Deno.env.get('VISION_API_KEY')
      || Deno.env.get('DEEPSEEK_API_KEY')
      || Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      return json({ error: 'VISION_API_KEY yoki DEEPSEEK_API_KEY sozlanmagan' }, 500)
    }

    const apiBase = Deno.env.get('VISION_API_BASE')
      || Deno.env.get('DEEPSEEK_API_BASE')
      || 'https://api.deepseek.com'

    const model = Deno.env.get('VISION_MODEL')
      || Deno.env.get('DEEPSEEK_MODEL')
      || 'deepseek-chat'

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && serviceKey && clinic_id) {
      const supabase = createClient(supabaseUrl, serviceKey)
      await supabase.from('import_jobs').insert({
        clinic_id: Number(clinic_id),
        source_type: 'vision',
        status: 'preview',
        total_rows: rows.length,
        meta: { model, mime_type },
      }).catch(() => {})
    }

    return json({
      ok: true,
      rows,
      row_count: rows.length,
      clinic_id: clinic_id || null,
    })
  } catch (err) {
    return json({ ok: false, error: err?.message || 'Unknown error' }, 500)
  }
})
