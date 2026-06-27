-- Ombor ↔ bemor tashrifi (MED-ID / odontogramma material sarfi)
ALTER TABLE public.inventory_logs
  ADD COLUMN IF NOT EXISTS visit_id BIGINT REFERENCES public.visits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_id BIGINT REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_inventory_logs_visit_id ON public.inventory_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_patient_id ON public.inventory_logs(patient_id);
