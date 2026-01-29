-- Tenant isolation: har bir klinika ma'lumotlari alohida.
-- patients, visits, payments ga clinic_id qo'shish va mavjudlarni default klinikaga bog'lash.

-- 1. PATIENTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.patients ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);

-- 2. VISITS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.visits ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_visits_clinic_id ON public.visits(clinic_id);

-- 3. PAYMENTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.payments ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON public.payments(clinic_id);

-- 4. BACKFILL (default clinic)
DO $$
DECLARE
  default_id BIGINT;
BEGIN
  SELECT id INTO default_id FROM public.clinics WHERE slug = 'default' LIMIT 1;
  IF default_id IS NOT NULL THEN
    UPDATE public.patients SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.visits   SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.payments SET clinic_id = default_id WHERE clinic_id IS NULL;
  END IF;
END $$;
