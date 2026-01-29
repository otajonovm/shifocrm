-- Super Admin & Multi-Tenant (Clinics) Migration
-- Run this after existing tables. Ensures clinics, profiles, and doctors.clinic_id.

-- -----------------------------------------------------------------------------
-- 1. CLINICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  max_doctors INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON public.clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_is_active ON public.clinics(is_active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_clinics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinics_updated_at ON public.clinics;
CREATE TRIGGER trigger_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_clinics_updated_at();

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE (role-based; super_admin bypasses tenant isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'super_admin')),
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.profiles.role IS 'super_admin: bypasses tenant isolation; admin/doctor: scoped to clinic_id';

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- 3. ADD clinic_id TO DOCTORS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE public.doctors ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. SEED DEFAULT CLINIC & BACKFILL doctors.clinic_id
-- -----------------------------------------------------------------------------
INSERT INTO public.clinics (name, slug, max_doctors, is_active)
SELECT 'Default Clinic', 'default', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.clinics WHERE slug = 'default');

-- Backfill existing doctors with default clinic
UPDATE public.doctors d
SET clinic_id = (SELECT id FROM public.clinics WHERE slug = 'default' LIMIT 1)
WHERE d.clinic_id IS NULL;

-- Optional: set NOT NULL after backfill (uncomment if desired)
-- ALTER TABLE public.doctors ALTER COLUMN clinic_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. CLINIC ADMINS (login / parol — klinika admini kirishi uchun)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinic_admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, login)
);

CREATE INDEX IF NOT EXISTS idx_clinic_admins_clinic_id ON public.clinic_admins(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_admins_login ON public.clinic_admins(login);

COMMENT ON TABLE public.clinic_admins IS 'Klinika adminlari: login + parol orqali kirish. Super Admin klinika yaratish/tahrirlashda beradi.';

-- -----------------------------------------------------------------------------
-- 6. RLS (optional; use per your security model)
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Policies: super_admin bypasses tenant checks; others filter by clinic_id.
