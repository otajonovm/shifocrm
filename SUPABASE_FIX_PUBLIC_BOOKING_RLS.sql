-- Public booking sahifalari (/d/:slug, /c/:slug) uchun anon o'qish
-- Supabase SQL Editor da bir marta run qiling.
-- https://shifocrm.app/d/vipdent kabi sahifalar 401/bo'sh qaytmasin.

BEGIN;

-- Doctors: faqat public profil
ALTER TABLE IF EXISTS public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctors_public_select ON public.doctors;
DROP POLICY IF EXISTS doctors_anon_public_select ON public.doctors;
CREATE POLICY doctors_anon_public_select
  ON public.doctors
  FOR SELECT
  TO anon, authenticated
  USING (COALESCE(is_public, false) = true);

-- Clinics: public clinic sahifa
ALTER TABLE IF EXISTS public.clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinics_anon_public_select ON public.clinics;
CREATE POLICY clinics_anon_public_select
  ON public.clinics
  FOR SELECT
  TO anon, authenticated
  USING (COALESCE(is_active, true) = true);

-- Services: narxlar ro'yxati
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS services_anon_public_select ON public.services;
CREATE POLICY services_anon_public_select
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Visits: slot bandligini hisoblash (faqat o'qish)
ALTER TABLE IF EXISTS public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS visits_anon_public_select ON public.visits;
CREATE POLICY visits_anon_public_select
  ON public.visits
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Leads: onlayn yozilish
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_public_insert ON public.leads;
DROP POLICY IF EXISTS leads_anon_public_insert ON public.leads;
DROP POLICY IF EXISTS leads_anon_public_select ON public.leads;
CREATE POLICY leads_anon_public_insert
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY leads_anon_public_select
  ON public.leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT SELECT ON public.clinics TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.visits TO anon, authenticated;
GRANT SELECT, INSERT ON public.leads TO anon, authenticated;

-- vipdent clinic bo'lsa faollashtirish (agar mavjud bo'lsa)
UPDATE public.clinics
SET is_active = true
WHERE lower(slug) = 'vipdent'
  AND COALESCE(is_active, false) = false;

-- Agar doctor public_slug = vipdent bo'lsa — public qilish
UPDATE public.doctors
SET is_public = true
WHERE lower(public_slug) = 'vipdent'
  AND COALESCE(is_public, false) = false;

COMMIT;
