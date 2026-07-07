-- =============================================================================
-- Premium modullar uchun RLS (clinic_features asosida)
-- SUPABASE_CLINIC_FEATURES_MIGRATION.sql dan KEYIN ishga tushiring.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- warehouse
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinic_inventory',
    'inventory_items',
    'inventory_movements',
    'inventory_logs',
    'inventory_consumptions',
    'expenses'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      EXECUTE format('DROP POLICY IF EXISTS "premium_warehouse_select" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "premium_warehouse_select" ON public.%I FOR SELECT USING (
          public.clinic_has_active_feature(clinic_id, ''warehouse'')
        )',
        t
      );

      -- INSERT/UPDATE/DELETE ham warehouse faol bo'lganda
      EXECUTE format('DROP POLICY IF EXISTS "premium_warehouse_write" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "premium_warehouse_write" ON public.%I FOR ALL USING (
          public.clinic_has_active_feature(clinic_id, ''warehouse'')
        ) WITH CHECK (
          public.clinic_has_active_feature(clinic_id, ''warehouse'')
        )',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Eski ochiq policy'larni o'chirish (warehouse jadvallari)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'clinic_inventory', 'inventory_items', 'inventory_movements',
        'inventory_logs', 'inventory_consumptions', 'expenses'
      )
      AND policyname NOT IN ('premium_warehouse_select', 'premium_warehouse_write')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- sms_marketing — notification_events
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_events'
  ) THEN
    ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "App manage notification events" ON public.notification_events;
    DROP POLICY IF EXISTS "premium_sms_select" ON public.notification_events;
    DROP POLICY IF EXISTS "premium_sms_write" ON public.notification_events;

    CREATE POLICY "premium_sms_select" ON public.notification_events
      FOR SELECT USING (
        public.clinic_has_active_feature(clinic_id, 'sms_marketing')
      );

    CREATE POLICY "premium_sms_write" ON public.notification_events
      FOR ALL USING (
        public.clinic_has_active_feature(clinic_id, 'sms_marketing')
      ) WITH CHECK (
        public.clinic_has_active_feature(clinic_id, 'sms_marketing')
      );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- kpi_finance — payments
-- SELECT: hisobotlar uchun premium (UI ham gate qiladi)
-- INSERT/UPDATE/DELETE: bemor to'lovi — CORE (har doim ruxsat)
-- -----------------------------------------------------------------------------
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

    -- Hisobotlar / KPI (premium modul yoqilganda to'liq o'qish)
    CREATE POLICY "premium_kpi_payments_select" ON public.payments
      FOR SELECT USING (
        public.clinic_has_active_feature(clinic_id, 'kpi_finance')
      );

    -- Bemor kartasida to'lov — core (SELECT ham kerak: ro'yxat ko'rsatish)
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

-- activity_logs — audit (yozish har doim; premium faqat UI darajasida)
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
