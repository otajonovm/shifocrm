-- Xodimlar (HR) moduli uchun doctors jadvaliga qo'shimcha ustunlar
-- Supabase SQL Editor da bir marta ishga tushiring.

ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS work_schedule JSONB;

ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS chair_number TEXT;

ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS salary_percentage NUMERIC;

COMMENT ON COLUMN public.doctors.work_schedule IS
  'Haftalik ish jadvali: { chair_number, days: { mon: { enabled, start, end }, ... } }';

COMMENT ON COLUMN public.doctors.chair_number IS
  'Biriktirilgan stomatologik kreslo / kabinet (masalan: 1-Kreslo)';

COMMENT ON COLUMN public.doctors.salary_percentage IS
  'Shifokor ulushi foizi (KPI %)';
