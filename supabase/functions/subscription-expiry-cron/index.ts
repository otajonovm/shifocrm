/**
 * Obuna muddati tugagan yozuvlarni o'chirish (cron har kuni 00:00 Toshkent).
 *
 * Supabase Dashboard → Edge Functions → subscription-expiry-cron
 * Cron: 0 19 * * *  (UTC — Toshkent 00:00)
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'SUPABASE env missing' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data, error } = await supabase.rpc('expire_due_subscriptions')

  if (error) {
    console.error('expire_due_subscriptions failed:', error)
    return json({ ok: false, error: error.message }, 500)
  }

  return json({
    ok: true,
    expired_count: data ?? 0,
    ran_at: new Date().toISOString(),
  })
})
