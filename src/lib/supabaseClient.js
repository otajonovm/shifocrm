/**
 * Supabase JS client — Realtime obunalar uchun
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/api/supabaseConfig'

let client = null

export const getSupabaseClient = () => {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Supabase Auth (individual signup/login) uchun sessiya saqlanishi kerak.
        // Mavjud custom login localStorage bilan alohida ishlaydi, ular to'qnashmaydi.
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'shifocrm-supabase-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 8,
        },
      },
    })
  }
  return client
}
