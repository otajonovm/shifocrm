/**
 * ShifoAI — OpenAI-compatible chat API (DeepSeek va boshqalar).
 * API kalit: VITE_SHIFOAI_API_KEY (.env faylida, GitHub ga qo'ymang).
 */

import { buildSystemPrompt } from '@/lib/shifoAI/systemPrompt'

const API_BASE = String(
  import.meta.env.VITE_SHIFOAI_API_BASE
  || import.meta.env.VITE_DEEPSEEK_API_BASE
  || 'https://api.deepseek.com',
).replace(/\/$/, '')

const API_MODEL = import.meta.env.VITE_SHIFOAI_MODEL
  || import.meta.env.VITE_DEEPSEEK_MODEL
  || 'deepseek-chat'

/** .env: VITE_SHIFOAI_API_KEY yoki VITE_DEEPSEEK_API_KEY */
export function getShifoAIApiKey() {
  return String(
    import.meta.env.VITE_SHIFOAI_API_KEY
    || import.meta.env.VITE_DEEPSEEK_API_KEY
    || '',
  ).trim()
}

export const isShifoAIOnline = () => Boolean(getShifoAIApiKey())

/**
 * @param {object} params
 * @param {Array<{role: 'user'|'assistant', text: string}>} params.messages
 * @param {object} [params.context]
 * @returns {Promise<string>}
 */
export async function chatWithShifoAI({ messages = [], context = {} } = {}) {
  const apiKey = getShifoAIApiKey()
  if (!apiKey) {
    const error = new Error('OFFLINE')
    error.code = 'SHIFOAI_OFFLINE'
    throw error
  }

  const systemPrompt = buildSystemPrompt(context)
  const payload = {
    model: API_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.text || ''),
      })),
    ],
    temperature: 0.35,
    max_tokens: 1200,
  }

  const response = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.error?.message || body?.message || ''
    } catch {
      detail = response.statusText
    }
    const error = new Error(detail || `ShifoAI xatolik (${response.status})`)
    error.code = 'SHIFOAI_API_ERROR'
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    const error = new Error('ShifoAI javob qaytarmadi')
    error.code = 'SHIFOAI_EMPTY'
    throw error
  }
  return String(content).trim()
}
