/**
 * Supabase Configuration
 * REST API orqali fetch bilan ishlash
 */

export const SUPABASE_URL = 'https://qwngzvtanjlkvdbkvbew.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmd6dnRhbmpsa3ZkYmt2YmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzAxOTQsImV4cCI6MjA4MzYwNjE5NH0.PkSebyYQ5TDdPUBikgh3W6NlPh__aiIKT3Z9xcIbFyM'

// REST API base URL
export const REST_URL = `${SUPABASE_URL}/rest/v1`

// Default headers for all requests
export const getHeaders = () => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
})

// Helper: GET request
export const supabaseGet = async (table, query = '') => {
  const url = `${REST_URL}/${table}${query ? `?${query}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

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
