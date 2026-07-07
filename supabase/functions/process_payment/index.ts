/**
 * To'lov webhook — obunani +30 kun uzaytiradi.
 *
 * Supabase Dashboard → Edge Functions → process_payment
 * verify_jwt = false (tashqi to'lov tizimi webhook)
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMENT_WEBHOOK_SECRET
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const parseBody = async (req) => {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return await req.json()
  }
  const text = await req.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
      },
    })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET')

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'SUPABASE env missing' }, 500)
  }

  const headerSecret = req.headers.get('x-webhook-secret')
  const body = await parseBody(req)
  const bodySecret = body?.webhook_secret || body?.secret

  if (webhookSecret) {
    const provided = headerSecret || bodySecret
    if (provided !== webhookSecret) {
      return json({ ok: false, error: 'Invalid webhook secret' }, 401)
    }
  }

  const clinicId = Number(body?.clinic_id)
  if (!Number.isFinite(clinicId)) {
    return json({ ok: false, error: 'clinic_id required' }, 400)
  }

  const planKey = String(body?.plan_key || 'monthly_standard').trim()
  const paymentProvider = body?.payment_provider ? String(body.payment_provider) : null
  const paymentReference = body?.payment_reference
    ? String(body.payment_reference)
    : body?.transaction_id
      ? String(body.transaction_id)
      : null
  const extendDays = Number(body?.extend_days || 30)

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data, error } = await supabase.rpc('renew_clinic_subscription', {
    p_clinic_id: clinicId,
    p_plan_key: planKey,
    p_payment_provider: paymentProvider,
    p_payment_reference: paymentReference,
    p_extend_days: Number.isFinite(extendDays) ? extendDays : 30,
  })

  if (error) {
    console.error('renew_clinic_subscription failed:', error)
    return json({ ok: false, error: error.message }, 500)
  }

  return json({
    ok: true,
    subscription: data,
    clinic_id: clinicId,
    plan_key: planKey,
    extended_days: Number.isFinite(extendDays) ? extendDays : 30,
  })
})
