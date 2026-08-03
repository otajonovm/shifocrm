-- activity_logs 401 (RLS) tuzatish — anon app audit yozishi uchun
-- Supabase SQL Editor da bir marta run qiling.

BEGIN;

ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Super admins insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "App manage activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_anon_all ON public.activity_logs;
DROP POLICY IF EXISTS "premium_kpi_activity_select" ON public.activity_logs;
DROP POLICY IF EXISTS "premium_kpi_activity_insert" ON public.activity_logs;
DROP POLICY IF EXISTS "core_activity_logs_insert" ON public.activity_logs;
DROP POLICY IF EXISTS "core_activity_logs_update" ON public.activity_logs;
DROP POLICY IF EXISTS "core_activity_logs_delete" ON public.activity_logs;

CREATE POLICY activity_logs_anon_all
  ON public.activity_logs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated, service_role;

COMMIT;
