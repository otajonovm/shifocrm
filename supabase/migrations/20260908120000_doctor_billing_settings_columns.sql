BEGIN;

ALTER TABLE IF EXISTS public.doctor_billing_settings
  ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'percentage';

ALTER TABLE IF EXISTS public.doctor_billing_settings
  ADD COLUMN IF NOT EXISTS doctor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 40;

ALTER TABLE IF EXISTS public.doctor_billing_settings
  ADD COLUMN IF NOT EXISTS rent_type TEXT DEFAULT 'monthly';

ALTER TABLE IF EXISTS public.doctor_billing_settings
  ADD COLUMN IF NOT EXISTS rent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
