#!/usr/bin/env node
/**
 * Read-only security assertions against a Supabase project.
 * Uses service role for catalog checks and anon key for access probes.
 *
 * Env:
 *   VITE_SUPABASE_URL / SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY (optional, for pg catalog via RPC or REST)
 */

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !anon) {
  console.error('Missing SUPABASE_URL / ANON key')
  process.exit(2)
}

const failures = []

async function restGet(path, key) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, body }
}

async function probeAnonTable(table) {
  const { status, body } = await restGet(`${table}?select=id&limit=1`, anon)
  const rows = Array.isArray(body) ? body.length : null
  const ok = status === 401 || status === 403 || rows === 0
  if (!ok) {
    failures.push(`anon can read ${table}: status=${status} rows=${rows}`)
  } else {
    console.log(`OK anon deny/empty: ${table} (${status}, rows=${rows})`)
  }
}

async function checkConstraintViaSql() {
  if (!service) {
    console.warn('SKIP catalog checks (no SUPABASE_SERVICE_ROLE_KEY)')
    return
  }
  // PostgREST cannot query pg_catalog directly; use rpc if present, else skip.
  const res = await fetch(`${url}/rest/v1/rpc/verify_security_catalog`, {
    method: 'POST',
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  if (res.status === 404) {
    console.warn('SKIP catalog RPC verify_security_catalog (not deployed)')
    return
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    failures.push(`verify_security_catalog failed: ${res.status}`)
    return
  }
  console.log('OK catalog', body)
}

async function main() {
  const tables = [
    'patients',
    'visits',
    'payments',
    'employees',
    'odontograms',
    'visit_services',
    'inventory_logs',
  ]
  for (const t of tables) {
    await probeAnonTable(t)
  }
  await checkConstraintViaSql()

  if (failures.length) {
    console.error('\nFAILED:')
    failures.forEach((f) => console.error(' -', f))
    process.exit(1)
  }
  console.log('\nAll read-only security probes passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
