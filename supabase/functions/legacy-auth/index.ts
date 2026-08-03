import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import bcrypt from 'npm:bcryptjs@2.4.3'
import { SignJWT, jwtVerify } from 'npm:jose@5.9.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const trimStr = (value: unknown) => String(value ?? '').trim()

const phoneVariants = (value: string) => {
  const digits = value.replace(/\D/g, '')
  const out = new Set<string>()
  if (!digits) return []
  let core = digits.startsWith('998') ? digits : `998${digits}`
  core = core.slice(0, 12)
  if (core.length === 12) {
    out.add(`+${core}`)
    out.add(core)
  }
  if (digits.length >= 9) out.add(digits)
  out.add(value.trim())
  return [...out]
}

const passwordMatches = async (provided: string, row: Record<string, unknown>) => {
  const plain = trimStr(provided)
  if (!plain) return false
  const hash = trimStr(row.password_hash)
  if (hash) {
    try {
      return await bcrypt.compare(plain, hash)
    } catch {
      return false
    }
  }
  return plain === trimStr(row.password)
}

const hashLegacyPassword = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  id: string | number,
  password: string,
  row: Record<string, unknown>,
) => {
  if (trimStr(row.password_hash) || !trimStr(row.password)) return
  const passwordHash = await bcrypt.hash(trimStr(password), 12)
  await supabase
    .from(table)
    .update({ password_hash: passwordHash, password: null })
    .eq('id', id)
}

const firstRow = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  column: string,
  value: string,
) => {
  if (!value) return null
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(column, value)
    .limit(1)
  if (error) {
    console.error(`find ${table}.${column} error:`, error.message)
    return null
  }
  return (Array.isArray(data) && data[0] ? data[0] : null) as Record<string, unknown> | null
}

const findOne = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  loginRaw: string,
) => {
  const login = trimStr(loginRaw)
  const lower = login.toLowerCase()
  const candidates = [
    ['login', login],
    ['login', lower],
    ['email', lower],
  ] as const

  for (const [column, value] of candidates) {
    const row = await firstRow(supabase, table, column, value)
    if (row) return row
  }

  // Case-insensitive login fallback
  {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .ilike('login', login.replace(/[%_]/g, '\\$&'))
      .limit(1)
    if (!error && Array.isArray(data) && data[0]) return data[0] as Record<string, unknown>
  }

  for (const phone of phoneVariants(login)) {
    const row = await firstRow(supabase, table, 'phone', phone)
    if (row) return row
  }

  return null
}

const resolveIdentity = async (
  supabase: ReturnType<typeof createClient>,
  loginRaw: string,
  password: string,
  portal: string,
) => {
  const login = trimStr(loginRaw).toLowerCase()
  const passwordPlain = trimStr(password)

  const superLogin = trimStr(Deno.env.get('LEGACY_SUPERADMIN_LOGIN')).toLowerCase()
  const superHash = trimStr(Deno.env.get('LEGACY_SUPERADMIN_PASSWORD_HASH'))
  const superPlain = trimStr(Deno.env.get('LEGACY_SUPERADMIN_PASSWORD'))
  if (portal === 'admin' && superLogin && login === superLogin) {
    const ok = superHash
      ? await bcrypt.compare(passwordPlain, superHash)
      : (superPlain.length > 0 && superPlain === passwordPlain)
    if (ok) {
      return {
        principal_type: 'superadmin',
        principal_id: 'global',
        app_role: 'superadmin',
        clinic_id: null,
        employee_id: null,
        doctor_id: null,
        user: { account_type: 'superadmin', login },
        permissions: {},
      }
    }
  }

  if (portal === 'doctor') {
    const doctor = await findOne(supabase, 'doctors', loginRaw)
    if (!doctor || doctor.is_active === false || !(await passwordMatches(passwordPlain, doctor))) {
      return null
    }
    await hashLegacyPassword(supabase, 'doctors', doctor.id as number, passwordPlain, doctor)

    const { data: employee } = await supabase
      .from('employees')
      .select('*, employee_permissions(*)')
      .eq('legacy_doctor_id', doctor.id)
      .eq('clinic_id', doctor.clinic_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    const role = String(employee?.role || 'doctor')
    return {
      principal_type: 'doctor',
      principal_id: String(doctor.id),
      app_role: role === 'chief_doctor' ? 'chief_doctor' : 'doctor',
      clinic_id: Number(doctor.clinic_id),
      employee_id: employee?.id || null,
      doctor_id: Number(doctor.id),
      user: {
        id: Number(doctor.id),
        employee_id: employee?.id || undefined,
        full_name: doctor.full_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        patients_scope: doctor.patients_scope || 'own',
        clinic_id: Number(doctor.clinic_id),
        account_type: 'doctor',
      },
      permissions: employee?.employee_permissions?.[0] || employee?.employee_permissions || {},
    }
  }

  for (const table of ['clinic_owners', 'clinic_admins', 'employees']) {
    const row = await findOne(supabase, table, loginRaw)
    if (!row) continue
    if (row.is_active === false) continue
    if (!(await passwordMatches(passwordPlain, row))) continue

    await hashLegacyPassword(supabase, table, row.id as string | number, passwordPlain, row)

    const clinicId = row.clinic_id == null ? null : Number(row.clinic_id)
    if (clinicId != null) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id,is_active,clinic_type')
        .eq('id', clinicId)
        .maybeSingle()
      if (!clinic || clinic.is_active === false) return null
    }

    if (table === 'clinic_owners') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .limit(1)
        .maybeSingle()
      const isSolo = Boolean(
        doctor && String(doctor.email || doctor.phone || '').toLowerCase() === login,
      )
      return {
        principal_type: 'clinic_owner',
        principal_id: String(row.id),
        app_role: isSolo ? 'solo' : 'clinic_owner',
        clinic_id: clinicId,
        employee_id: null,
        doctor_id: isSolo ? Number(doctor?.id) : null,
        user: isSolo
          ? { ...doctor, clinic_id: clinicId, owner_id: row.id, account_type: 'solo' }
          : { login: row.login, clinic_id: clinicId, owner_id: row.id, account_type: 'clinic_owner' },
        permissions: {},
      }
    }

    if (table === 'clinic_admins') {
      return {
        principal_type: 'clinic_admin',
        principal_id: String(row.id),
        app_role: 'admin',
        clinic_id: clinicId,
        employee_id: null,
        doctor_id: null,
        user: {
          login: row.login,
          clinic_id: clinicId,
          admin_id: row.id,
          account_type: 'clinic_admin',
        },
        permissions: {},
      }
    }

    const { data: permissions } = await supabase
      .from('employee_permissions')
      .select('*')
      .eq('employee_id', row.id)
      .maybeSingle()
    const dbRole = String(row.role || 'administrator')
    return {
      principal_type: 'employee',
      principal_id: String(row.id),
      app_role: dbRole,
      clinic_id: clinicId,
      employee_id: row.id,
      doctor_id: row.legacy_doctor_id == null ? null : Number(row.legacy_doctor_id),
      user: {
        employee_id: row.id,
        id: row.legacy_doctor_id || undefined,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        clinic_id: clinicId,
        account_type: `employee_${dbRole}`,
        login: trimStr(loginRaw),
      },
      permissions: permissions || {},
    }
  }

  return null
}

const issueSession = async (
  supabase: ReturnType<typeof createClient>,
  identity: Record<string, unknown>,
  secret: Uint8Array,
  existingSessionId?: string,
) => {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + 60 * 60 * 8
  let sessionId = existingSessionId

  if (!sessionId) {
    const { data, error } = await supabase
      .from('app_sessions')
      .insert({
        principal_type: identity.principal_type,
        principal_id: identity.principal_id,
        clinic_id: identity.clinic_id,
        employee_id: identity.employee_id,
        doctor_id: identity.doctor_id,
        app_role: identity.app_role,
        expires_at: new Date(expiresAt * 1000).toISOString(),
      })
      .select('id')
      .single()
    if (error) {
      console.error('app_sessions insert failed:', error)
      throw error
    }
    sessionId = data.id
  }

  const token = await new SignJWT({
    role: 'authenticated',
    app_role: identity.app_role,
    clinic_id: identity.clinic_id,
    employee_id: identity.employee_id,
    doctor_id: identity.doctor_id,
    principal_type: identity.principal_type,
    permissions: (identity.permissions as Record<string, unknown>)?.permissions || {},
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(sessionId))
    .setAudience('authenticated')
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setJti(String(sessionId))
    .sign(secret)

  return {
    access_token: token,
    expires_at: expiresAt,
    role: identity.app_role,
    clinic_id: identity.clinic_id,
    user: identity.user,
    permissions: identity.permissions,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const jwtSecret = Deno.env.get('APP_JWT_SECRET')
    if (!url || !serviceKey || !jwtSecret) {
      return json({ error: 'Server auth env missing' }, 500)
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
    const secret = new TextEncoder().encode(jwtSecret)
    const body = await req.json().catch(() => ({}))

    if (body.action === 'login') {
      const login = trimStr(body.login)
      const password = trimStr(body.password)
      if (!login || !password) return json({ error: 'Invalid credentials' }, 401)
      const identity = await resolveIdentity(
        supabase,
        login,
        password,
        String(body.portal || 'admin'),
      )
      if (!identity) return json({ error: 'Invalid credentials' }, 401)
      try {
        return json(await issueSession(supabase, identity, secret))
      } catch (err) {
        console.error('issueSession failed:', err)
        return json({
          error: 'Session create failed. app_sessions migratsiyasini qo‘llang.',
          detail: String((err as Error)?.message || err),
        }, 500)
      }
    }

    const bearer = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (!bearer) return json({ error: 'Unauthorized' }, 401)

    const { payload } = await jwtVerify(bearer, secret, { audience: 'authenticated' })
    const sessionId = String(payload.jti || payload.sub || '')
    const { data: session } = await supabase
      .from('app_sessions')
      .select('*')
      .eq('id', sessionId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (!session) return json({ error: 'Session expired' }, 401)

    if (body.action === 'logout') {
      await supabase.from('app_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', sessionId)
      return json({ ok: true })
    }

    const identity = {
      principal_type: session.principal_type,
      principal_id: session.principal_id,
      app_role: session.app_role,
      clinic_id: session.clinic_id,
      employee_id: session.employee_id,
      doctor_id: session.doctor_id,
      user: body.user || {
        employee_id: session.employee_id,
        id: session.doctor_id,
        clinic_id: session.clinic_id,
        account_type: session.principal_type,
      },
      permissions: {},
    }
    return json(await issueSession(supabase, identity, secret, sessionId))
  } catch (err) {
    console.error('legacy-auth error:', err)
    return json({ error: 'Auth failed', detail: String((err as Error)?.message || err) }, 500)
  }
})
