-- inventory_logs ga visit/patient/doctor bog'lash (odontogram material sarfi)
-- Supabase SQL Editor da bir marta ishga tushiring.

ALTER TABLE IF EXISTS public.inventory_logs
  ADD COLUMN IF NOT EXISTS visit_id BIGINT REFERENCES public.visits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_id BIGINT REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id BIGINT,
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_logs_visit_id
  ON public.inventory_logs(visit_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_patient_id
  ON public.inventory_logs(patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_log_source
  ON public.inventory_logs(clinic_id, source_key)
  WHERE source_key IS NOT NULL;
