/**
 * Vision import — daftar rasmini structured JSON ga aylantirish.
 * Gemini yoki OpenAI GPT-4o Vision.
 *
 * Secrets: GEMINI_API_KEY | OPENAI_API_KEY, VISION_MODEL
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DENTAL_LEDGER_PROMPT = `Siz stomatologik klinika daftarini o'qiydigan AI ekspertsiz.
JSON massiv qaytaring. Har bir bemor: full_name, phone, diagnosis, visit_history (visit_date, start_time, service_name, price, paid_amount, treatments).
Faqat JSON massiv.`

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function extractJsonArray(text) {
  const trimmed = String(text || '').trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1))
  throw new Error('JSON massiv topilmadi')
}

async function callGeminiVision({ apiKey, model, imageBase64, mimeType }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: DENTAL_LEDGER_PROMPT }] },
      contents: [{
        role: 'user',
        parts: [
          { text: 'Daftar rasmidan bemorlar JSON massivini ajrating.' },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  })
  if (!response.ok) throw new Error((await response.text()).slice(0, 300))
  const data = await response.json()
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p?.text || '').join('')
}

async function callOpenAIVision({ apiKey, model, imageBase64, mimeType }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: DENTAL_LEDGER_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Daftar rasmidan bemorlar JSON massivini ajrating.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  })
  if (!response.ok) throw new Error((await response.text()).slice(0, 300))
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || '[]'
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed.patients || parsed)
  } catch {
    return content
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  try {
    const { image_base64, mime_type = 'image/jpeg', clinic_id, storage_path } = await req.json()
    if (!image_base64 || String(image_base64).length < 100) {
      return json({ error: 'image_base64 majburiy' }, 400)
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VISION_API_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const useGemini = Boolean(geminiKey)
    const apiKey = geminiKey || openaiKey
    if (!apiKey) return json({ error: 'GEMINI_API_KEY yoki OPENAI_API_KEY sozlanmagan' }, 500)

    const model = Deno.env.get('VISION_MODEL') || (useGemini ? 'gemini-flash-latest' : 'gpt-4o')

    const rawText = useGemini
      ? await callGeminiVision({ apiKey, model, imageBase64: image_base64, mimeType: mime_type })
      : await callOpenAIVision({ apiKey, model, imageBase64: image_base64, mimeType: mime_type })

    let rows = []
    try { rows = extractJsonArray(rawText) } catch { rows = [] }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey)
      if (storage_path) {
        await supabase.storage.from('import-temp').remove([storage_path.replace(/^import-temp\//, '')]).catch(() => {})
      }
      if (clinic_id) {
        await supabase.from('import_jobs').insert({
          clinic_id: Number(clinic_id),
          source_type: 'vision',
          status: 'preview',
          total_rows: rows.length,
          meta: { model, mime_type },
        }).catch(() => {})
      }
    }

    return json({ ok: true, rows, row_count: rows.length })
  } catch (err) {
    return json({ ok: false, error: err?.message || 'Unknown error' }, 500)
  }
})
