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
        persistSession: false,
        autoRefreshToken: false,
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
