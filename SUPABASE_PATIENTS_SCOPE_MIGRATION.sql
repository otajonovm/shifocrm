-- Patients scope migration for doctors
-- Minimal access model: own/all

ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS patients_scope TEXT;

UPDATE public.doctors
SET patients_scope = 'own'
WHERE patients_scope IS NULL OR TRIM(patients_scope) = '';

ALTER TABLE public.doctors
ALTER COLUMN patients_scope SET DEFAULT 'own';

ALTER TABLE public.doctors
ALTER COLUMN patients_scope SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctors_patients_scope_check'
  ) THEN
    ALTER TABLE public.doctors
    ADD CONSTRAINT doctors_patients_scope_check
    CHECK (patients_scope IN ('own', 'all'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doctors_patients_scope ON public.doctors(patients_scope);