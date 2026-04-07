-- Doctors public location URL migration
-- Adds optional map/location URL used on doctor public profile

BEGIN;

ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS public_location_url TEXT;

COMMIT;
