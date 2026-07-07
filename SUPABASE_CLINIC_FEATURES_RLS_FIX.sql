-- =============================================================================
-- RLS tuzatish: payments + activity_logs (to'liq tiklash)
-- Supabase SQL Editor da ishga tushiring.
-- =============================================================================

-- payments — bemor to'lovi (core)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view all payments" ON public.payments;
    DROP POLICY IF EXISTS "Public can insert payments" ON public.payments;
    DROP POLICY IF EXISTS "Public can update payments" ON public.payments;
    DROP POLICY IF EXISTS "Public can delete payments" ON public.payments;
    DROP POLICY IF EXISTS "premium_kpi_payments_select" ON public.payments;
    DROP POLICY IF EXISTS "core_payments_select" ON public.payments;
    DROP POLICY IF EXISTS "core_payments_insert" ON public.payments;
    DROP POLICY IF EXISTS "core_payments_update" ON public.payments;
    DROP POLICY IF EXISTS "core_payments_delete" ON public.payments;

    CREATE POLICY "core_payments_select" ON public.payments
      FOR SELECT USING (true);

    CREATE POLICY "core_payments_insert" ON public.payments
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "core_payments_update" ON public.payments
      FOR UPDATE USING (true) WITH CHECK (true);

    CREATE POLICY "core_payments_delete" ON public.payments
      FOR DELETE USING (true);
  END IF;
END $$;

-- activity_logs — audit yozish/o'qish (anon app)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Super admins view activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "Super admins insert activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "App manage activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "premium_kpi_activity_select" ON public.activity_logs;
    DROP POLICY IF EXISTS "premium_kpi_activity_insert" ON public.activity_logs;
    DROP POLICY IF EXISTS "core_activity_logs_insert" ON public.activity_logs;
    DROP POLICY IF EXISTS "core_activity_logs_update" ON public.activity_logs;
    DROP POLICY IF EXISTS "core_activity_logs_delete" ON public.activity_logs;

    CREATE POLICY "App manage activity logs"
      ON public.activity_logs
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated, service_role;
