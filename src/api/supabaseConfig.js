/**
 * Supabase Configuration
 * REST API orqali fetch bilan ishlash
 */

export const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
export const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY sozlanmagan')
}

// REST API base URL
export const REST_URL = `${SUPABASE_URL}/rest/v1`

// Default headers for all requests (anon key — oddiy clinic CRM login)
export const getHeaders = () => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
})

const toNetworkError = (error) => {
  const e = new Error(
    'Internet aloqasi yo‘q yoki Supabase ga ulanib bo‘lmadi. Wi‑Fi/VPN ni tekshirib qayta urinib ko‘ring.',
  )
  e.status = 0
  e.code = 'NETWORK_ERROR'
  e.cause = error
  return e
}

// Helper: GET request
export const supabaseGet = async (table, query = '') => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const e = new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY sozlanmagan')
    e.status = 503
    e.code = 'ENV_MISSING'
    throw e
  }

  const url = `${REST_URL}/${table}${query ? `?${query}` : ''}`
  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    })
  } catch (error) {
    throw toNetworkError(error)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const e = new Error(body.message || `GET failed: ${response.status}`)
    e.status = response.status
    e.code = body.code
    e.details = body.details
    throw e
  }

  return response.json()
}

// Helper: POST request (insert)
export const supabasePost = async (table, data) => {
  const url = `${REST_URL}/${table}`
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const e = new Error(body.message || `POST failed: ${response.status}`)
    e.status = response.status
    e.code = body.code
    e.details = body.details
    throw e
  }

  const result = await response.json().catch(() => [])
  return Array.isArray(result) ? result : []
}

// Helper: PATCH request (update)
export const supabasePatch = async (table, id, data) => {
  const url = `${REST_URL}/${table}?id=eq.${id}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const e = new Error(body.message || `PATCH failed: ${response.status}`)
    e.status = response.status
    e.code = body.code
    e.details = body.details
    throw e
  }

  return response.json()
}

// Helper: PATCH request by query (bulk update)
// Example query: "doctor_id=eq.123&clinic_id=eq.1"
export const supabasePatchWhere = async (table, query, data) => {
  const q = (query || '').toString().replace(/^\?/, '')
  if (!q) throw new Error('PATCH WHERE requires query')
  const url = `${REST_URL}/${table}?${q}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const e = new Error(body.message || `PATCH failed: ${response.status}`)
    e.status = response.status
    e.code = body.code
    e.details = body.details
    throw e
  }

  return response.json()
}

// Helper: DELETE request by query (bulk delete / scoped delete)
// Example query: "id=eq.123&clinic_id=eq.1"
export const supabaseDeleteWhere = async (table, query) => {
  const q = (query || '').toString().replace(/^\?/, '')
  if (!q) throw new Error('DELETE WHERE requires query')
  const url = `${REST_URL}/${table}?${q}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const e = new Error(error.message || `DELETE failed: ${response.status}`)
    e.status = response.status
    e.code = error.code
    e.details = error.details
    throw e
  }

  return true
}

// Helper: DELETE request
export const supabaseDelete = async (table, id) => {
  const url = `${REST_URL}/${table}?id=eq.${id}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `DELETE failed: ${response.status}`)
  }

  return true
}

export const supabaseRpc = async (functionName, args = {}) => {
  const response = await fetch(`${REST_URL}/rpc/${functionName}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(args),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.message || `${functionName} failed: ${response.status}`)
    error.status = response.status
    error.code = body.code
    error.details = body.details
    throw error
  }
  return response.json().catch(() => null)
}
