-- Doctor profile schedule fields
ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS work_schedule jsonb;

