const path = require('path')
const dotenv = require('dotenv')

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })

  process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.VITE_SUPABASE_SERVICE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || ''
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
}

function supabaseKeyRole() {
  const key = process.env.SUPABASE_SERVICE_KEY || ''
  const part = key.split('.')[1]
  if (!part) return ''
  try {
    const json = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
    return String(json.role || '')
  } catch {
    return ''
  }
}

module.exports = {
  loadEnv,
  supabaseKeyRole,
}
