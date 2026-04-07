-- Clinic profile settings migration
-- Adds profile fields editable by clinic admins in Settings page

BEGIN;

ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS work_schedule JSONB;

CREATE INDEX IF NOT EXISTS idx_clinics_work_schedule ON public.clinics USING GIN (work_schedule);

COMMIT;
