-- =============================================================================
-- ShifoCRM — Foydalanuvchi boshqaruvi, auto-obuna, login audit
-- Supabase SQL Editor da BIR MARTA ishga tushiring.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles — admin/owner uchun UPDATE va DELETE RLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_global_superadmin_profile()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND LOWER(COALESCE(p.role, '')) IN ('superadmin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_profile_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        LOWER(COALESCE(p.member_role, '')) IN ('owner', 'admin')
        OR LOWER(COALESCE(p.role, '')) = 'admin'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_target_profile(
  target_user_id UUID,
  target_clinic_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.is_global_superadmin_profile()
    OR (
      public.is_clinic_profile_manager()
      AND target_user_id IS DISTINCT FROM auth.uid()
      AND target_clinic_id IS NOT NULL
      AND target_clinic_id = public.current_clinic_id()
    );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: manager update" ON public.profiles;
CREATE POLICY "Profiles: manager update"
  ON public.profiles FOR UPDATE
  USING (public.can_manage_target_profile(user_id, clinic_id))
  WITH CHECK (public.can_manage_target_profile(user_id, clinic_id));

DROP POLICY IF EXISTS "Profiles: manager delete" ON public.profiles;
CREATE POLICY "Profiles: manager delete"
  ON public.profiles FOR DELETE
  USING (public.can_manage_target_profile(user_id, clinic_id));

DROP POLICY IF EXISTS "Profiles: superadmin read all" ON public.profiles;
CREATE POLICY "Profiles: superadmin read all"
  ON public.profiles FOR SELECT
  USING (public.is_global_superadmin_profile());

-- Mavjud custom-auth ilovasi uchun (employees kabi app qatlami)
DROP POLICY IF EXISTS "Profiles: app manage" ON public.profiles;
CREATE POLICY "Profiles: app manage"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. subscriptions — oylik obuna (auto-renewal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id       BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  plan_key        TEXT NOT NULL DEFAULT 'monthly_standard',
  status          BOOLEAN NOT NULL DEFAULT FALSE,
  expiry_date     TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  payment_provider TEXT,
  payment_reference TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_plan_key_check
    CHECK (plan_key IN ('monthly_standard', 'monthly_premium', 'trial')),
  CONSTRAINT subscriptions_clinic_plan_unique UNIQUE (clinic_id, plan_key)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id ON public.subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_date ON public.subscriptions(expiry_date);

CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscriptions_updated_at();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select"
  ON public.subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "subscriptions_manage" ON public.subscriptions;
CREATE POLICY "subscriptions_manage"
  ON public.subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO anon, authenticated, service_role;

-- To'lovdan keyin obunani uzaytirish (Edge Function chaqiradi)
CREATE OR REPLACE FUNCTION public.renew_clinic_subscription(
  p_clinic_id BIGINT,
  p_plan_key TEXT DEFAULT 'monthly_standard',
  p_payment_provider TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_extend_days INTEGER DEFAULT 30
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.subscriptions;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  IF p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'clinic_id required';
  END IF;

  v_new_expiry := GREATEST(COALESCE(
    (SELECT expiry_date FROM public.subscriptions
     WHERE clinic_id = p_clinic_id AND plan_key = p_plan_key),
    NOW()
  ), NOW()) + make_interval(days => GREATEST(p_extend_days, 1));

  INSERT INTO public.subscriptions (
    clinic_id, plan_key, status, expiry_date,
    last_payment_at, payment_provider, payment_reference
  )
  VALUES (
    p_clinic_id, p_plan_key, TRUE, v_new_expiry,
    NOW(), p_payment_provider, p_payment_reference
  )
  ON CONFLICT (clinic_id, plan_key) DO UPDATE
  SET
    status = TRUE,
    expiry_date = v_new_expiry,
    last_payment_at = NOW(),
    payment_provider = EXCLUDED.payment_provider,
    payment_reference = EXCLUDED.payment_reference,
    updated_at = NOW()
  RETURNING * INTO v_row;

  -- clinic_features bilan sinxronlash (premium modullar)
  UPDATE public.clinic_features
  SET
    is_active = TRUE,
    expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE clinic_id = p_clinic_id
    AND feature_key IN ('warehouse', 'sms_marketing', 'kpi_finance', 'shifo_ai');

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.renew_clinic_subscription(BIGINT, TEXT, TEXT, TEXT, INTEGER)
  TO anon, authenticated, service_role;

-- Muddati tugagan obunalarni o'chirish (cron / Edge Function)
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.subscriptions
  SET status = FALSE, updated_at = NOW()
  WHERE status = TRUE
    AND expiry_date IS NOT NULL
    AND expiry_date <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.clinic_features cf
  SET is_active = FALSE, updated_at = NOW()
  WHERE cf.is_active = TRUE
    AND cf.expires_at IS NOT NULL
    AND cf.expires_at <= NOW()
    AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.clinic_id = cf.clinic_id
        AND s.status = FALSE
    );

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO anon, authenticated, service_role;

-- pg_cron mavjud bo'lsa: har kuni 00:00 (Toshkent, UTC+5) = 19:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'shifocrm_expire_subscriptions';

    PERFORM cron.schedule(
      'shifocrm_expire_subscriptions',
      '0 19 * * *',
      $cron$SELECT public.expire_due_subscriptions();$cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Login audit — auth.sessions trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_auth_session_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, metadata, created_at)
  VALUES (
    NEW.user_id::text,
    'login',
    jsonb_build_object('source', 'auth_session_trigger', 'session_id', NEW.id),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Login bloklanmasin
    RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'sessions'
  ) THEN
    DROP TRIGGER IF EXISTS trg_audit_auth_session_login ON auth.sessions;
    CREATE TRIGGER trg_audit_auth_session_login
      AFTER INSERT ON auth.sessions
      FOR EACH ROW
      EXECUTE FUNCTION public.log_auth_session_login();
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'auth.sessions trigger skipped — Supabase dashboard orqali superuser bilan ishga tushiring';
  WHEN OTHERS THEN
    RAISE NOTICE 'auth.sessions trigger skipped: %', SQLERRM;
END $$;

-- =============================================================================
-- TEKSHIRUV:
--   SELECT * FROM public.subscriptions ORDER BY id DESC LIMIT 5;
--   SELECT public.renew_clinic_subscription(1, 'monthly_standard', 'test', 'ref-1', 30);
--   SELECT public.expire_due_subscriptions();
-- =============================================================================
