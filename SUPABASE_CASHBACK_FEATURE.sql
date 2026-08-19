-- =============================================================================
-- ShifoCRM — Ixtiyoriy keshbek moduli (clinic_features.cashback)
-- Supabase SQL Editor da bir marta ishga tushiring.
-- Default: o'chiq. Super admin klinika/yakka stom qo'shish yoki tahrirlashda yoqadi.
-- =============================================================================

ALTER TABLE public.clinic_features DROP CONSTRAINT IF EXISTS clinic_features_key_check;
ALTER TABLE public.clinic_features
  ADD CONSTRAINT clinic_features_key_check
  CHECK (feature_key IN ('warehouse', 'sms_marketing', 'kpi_finance', 'shifo_ai', 'cashback'));

INSERT INTO public.clinic_features (clinic_id, feature_key, is_active)
SELECT c.id, 'cashback', false
FROM public.clinics c
ON CONFLICT (clinic_id, feature_key) DO NOTHING;
