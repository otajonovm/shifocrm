/**
 * Supabase Configuration
 * REST API orqali fetch bilan ishlash
 */

export const SUPABASE_URL = 'https://qwngzvtanjlkvdbkvbew.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmd6dnRhbmpsa3ZkYmt2YmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMTcyMDYsImV4cCI6MjA1MjU5MzIwNn0.sb_publishable_NHM7-elbN0Vk7h1Epc2GIg_3dBozNLH'

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
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `GET failed: ${response.status}`)
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
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `POST failed: ${response.status}`)
  }
  
  return response.json()
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
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `PATCH failed: ${response.status}`)
  }
  
  return response.json()
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
