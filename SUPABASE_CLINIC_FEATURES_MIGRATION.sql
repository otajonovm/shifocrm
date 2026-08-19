-- =============================================================================
-- ShifoCRM — Modulli obuna: clinic_features
-- Supabase SQL Editor da bir marta ishga tushiring.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_features (
  id          BIGSERIAL PRIMARY KEY,
  clinic_id   BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ,  -- NULL = lifetime
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_clinic_features_clinic ON public.clinic_features(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_features_key ON public.clinic_features(feature_key);

ALTER TABLE public.clinic_features DROP CONSTRAINT IF EXISTS clinic_features_key_check;
ALTER TABLE public.clinic_features
  ADD CONSTRAINT clinic_features_key_check
  CHECK (feature_key IN ('warehouse', 'sms_marketing', 'kpi_finance', 'shifo_ai', 'cashback'));

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_clinic_features_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinic_features_updated_at ON public.clinic_features;
CREATE TRIGGER trg_clinic_features_updated_at
  BEFORE UPDATE ON public.clinic_features
  FOR EACH ROW
  EXECUTE FUNCTION public.set_clinic_features_updated_at();

-- -----------------------------------------------------------------------------
-- Helper: faol feature (is_active + expires_at)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinic_has_active_feature(
  p_clinic_id BIGINT,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_features cf
    WHERE cf.clinic_id = p_clinic_id
      AND cf.feature_key = p_feature_key
      AND cf.is_active = true
      AND (cf.expires_at IS NULL OR cf.expires_at > NOW())
  );
$$;

-- Kelajakdagi auth fazasi uchun (hozircha profiles.user_id orqali)
CREATE OR REPLACE FUNCTION public.current_clinic_has_feature(p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.clinic_has_active_feature(
    (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    p_feature_key
  );
$$;

-- -----------------------------------------------------------------------------
-- Seed: mavjud klinikalar uchun premium modullar (default o'chiq)
-- -----------------------------------------------------------------------------
INSERT INTO public.clinic_features (clinic_id, feature_key, is_active)
SELECT c.id, fk.key, false
FROM public.clinics c
CROSS JOIN (
  VALUES
    ('warehouse'),
    ('sms_marketing'),
    ('kpi_finance'),
    ('shifo_ai'),
    ('cashback')
) AS fk(key)
ON CONFLICT (clinic_id, feature_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- RLS clinic_features
-- -----------------------------------------------------------------------------
ALTER TABLE public.clinic_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_features_select" ON public.clinic_features;
CREATE POLICY "clinic_features_select"
  ON public.clinic_features FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "clinic_features_manage" ON public.clinic_features;
CREATE POLICY "clinic_features_manage"
  ON public.clinic_features FOR ALL
  USING (true)
  WITH CHECK (true);
