BEGIN;

-- Super Admin helper (idempotent — ba'zi muhitlarda faqat root SQL da bor)
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

CREATE TABLE IF NOT EXISTS public.doctor_dedicated_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  bot_token TEXT NOT NULL,
  bot_token_last4 TEXT,
  bot_username TEXT NOT NULL,
  bot_title TEXT,
  welcome_message TEXT,
  cashback_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00
    CHECK (cashback_percent >= 0 AND cashback_percent <= 100),
  max_spend_percent NUMERIC(5, 2) NOT NULL DEFAULT 30.00
    CHECK (max_spend_percent >= 0 AND max_spend_percent <= 100),
  referral_bonus NUMERIC(12, 2) NOT NULL DEFAULT 20000.00
    CHECK (referral_bonus >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doctor_dedicated_bots_doctor UNIQUE (doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_dedicated_bots_clinic
  ON public.doctor_dedicated_bots (clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_dedicated_bots_active
  ON public.doctor_dedicated_bots (doctor_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.doctor_bot_chats (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id BIGINT NOT NULL,
  chat_id TEXT NOT NULL,
  phone TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doctor_bot_chats_doctor_patient UNIQUE (doctor_id, patient_id),
  CONSTRAINT uq_doctor_bot_chats_doctor_chat UNIQUE (doctor_id, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_bot_chats_patient
  ON public.doctor_bot_chats (patient_id);

CREATE TABLE IF NOT EXISTS public.patient_referrals (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE SET NULL,
  doctor_id BIGINT REFERENCES public.doctors(id) ON DELETE CASCADE,
  referrer_patient_id BIGINT NOT NULL,
  referred_patient_id BIGINT NOT NULL,
  bonus_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patient_referrals
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT,
  ADD COLUMN IF NOT EXISTS doctor_id BIGINT,
  ADD COLUMN IF NOT EXISTS referrer_patient_id BIGINT,
  ADD COLUMN IF NOT EXISTS referred_patient_id BIGINT,
  ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_referrals_doctor_referred
  ON public.patient_referrals (doctor_id, referred_patient_id)
  WHERE doctor_id IS NOT NULL AND referred_patient_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_dedicated_bots_updated ON public.doctor_dedicated_bots;
CREATE TRIGGER trg_doctor_dedicated_bots_updated
  BEFORE UPDATE ON public.doctor_dedicated_bots
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_doctor_bot_chats_updated ON public.doctor_bot_chats;
CREATE TRIGGER trg_doctor_bot_chats_updated
  BEFORE UPDATE ON public.doctor_bot_chats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE VIEW public.doctor_dedicated_bot_settings
WITH (security_invoker = true) AS
SELECT
  id,
  clinic_id,
  doctor_id,
  bot_token_last4,
  bot_username,
  bot_title,
  welcome_message,
  cashback_percent,
  max_spend_percent,
  referral_bonus,
  is_active,
  webhook_url,
  created_at,
  updated_at
FROM public.doctor_dedicated_bots;

ALTER TABLE public.doctor_dedicated_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_bot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_dedicated_bots_superadmin ON public.doctor_dedicated_bots;
CREATE POLICY doctor_dedicated_bots_superadmin ON public.doctor_dedicated_bots
  FOR ALL TO anon, authenticated
  USING (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  )
  WITH CHECK (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  );

DROP POLICY IF EXISTS doctor_dedicated_bots_tenant_select ON public.doctor_dedicated_bots;
CREATE POLICY doctor_dedicated_bots_tenant_select ON public.doctor_dedicated_bots
  FOR SELECT TO anon, authenticated
  USING (
    clinic_id = public.current_clinic_id()
    OR doctor_id = public.current_doctor_id()
  );

DROP POLICY IF EXISTS doctor_bot_chats_superadmin ON public.doctor_bot_chats;
CREATE POLICY doctor_bot_chats_superadmin ON public.doctor_bot_chats
  FOR ALL TO anon, authenticated
  USING (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  )
  WITH CHECK (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  );

DROP POLICY IF EXISTS doctor_bot_chats_tenant_select ON public.doctor_bot_chats;
CREATE POLICY doctor_bot_chats_tenant_select ON public.doctor_bot_chats
  FOR SELECT TO anon, authenticated
  USING (
    clinic_id = public.current_clinic_id()
    OR doctor_id = public.current_doctor_id()
  );

DROP POLICY IF EXISTS patient_referrals_superadmin ON public.patient_referrals;
CREATE POLICY patient_referrals_superadmin ON public.patient_referrals
  FOR ALL TO anon, authenticated
  USING (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  )
  WITH CHECK (
    public.is_global_superadmin_profile()
    OR public.current_clinic_id() IS NULL
  );

DROP POLICY IF EXISTS patient_referrals_tenant_select ON public.patient_referrals;
CREATE POLICY patient_referrals_tenant_select ON public.patient_referrals
  FOR SELECT TO anon, authenticated
  USING (
    clinic_id = public.current_clinic_id()
    OR doctor_id = public.current_doctor_id()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_dedicated_bots TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_bot_chats TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_referrals TO anon, authenticated, service_role;
GRANT SELECT ON public.doctor_dedicated_bot_settings TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.doctor_bot_chats_id_seq TO anon, authenticated, service_role;

DO $$
BEGIN
  GRANT USAGE, SELECT ON SEQUENCE public.patient_referrals_id_seq TO anon, authenticated, service_role;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_object THEN
    NULL;
END $$;

REVOKE SELECT (bot_token, webhook_secret) ON public.doctor_dedicated_bots FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
