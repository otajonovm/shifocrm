-- =============================================================================
-- ShifoCRM — Faza 0+1: Supabase Auth + profiles
-- Supabase SQL Editor da BIR MARTA ishga tushiring.
--
-- MUHIM: profiles jadvali allaqachon mavjud bo'lishi mumkin (id = BIGINT).
-- Bu migratsiya mavjud jadvalni BUZMAYDI — faqat yangi ustunlar qo'shadi:
--   user_id UUID  -> auth.users(id) bilan bog'lanish
--   account_type  -> 'individual' | 'clinic_member'
--   member_role   -> 'owner' | 'admin' | 'doctor' (klinika ichidagi rol)
-- Eski profiles.role (admin/doctor/super_admin) o'zgartirilmaydi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Mavjud profiles jadvaliga yangi ustunlar
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id      UUID UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_role  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active    BOOLEAN NOT NULL DEFAULT TRUE;

-- user_id -> auth.users FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_user_id_fkey'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- account_type cheklovi
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('individual', 'clinic_member'));

-- member_role cheklovi (eski profiles.role dan alohida)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_member_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_member_role_check
  CHECK (member_role IS NULL OR member_role IN ('owner', 'admin', 'doctor'));

-- clinic_member bo'lsa clinic_id majburiy
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_clinic_member_requires_clinic;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_clinic_member_requires_clinic
  CHECK (account_type <> 'clinic_member' OR clinic_id IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 2. updated_at trigger (agar yo'q bo'lsa)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

-- -----------------------------------------------------------------------------
-- 3. handle_new_user() — auth.users -> profiles.user_id
--    Signup metadata: { account_type, full_name, phone, clinic_id, member_role }
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta          JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_account     TEXT;
  v_clinic_id   BIGINT;
  v_member_role TEXT;
BEGIN
  v_account := LOWER(COALESCE(meta->>'account_type', 'individual'));
  IF v_account NOT IN ('individual', 'clinic_member') THEN
    v_account := 'individual';
  END IF;

  IF (meta->>'clinic_id') ~ '^\d+$' THEN
    v_clinic_id := (meta->>'clinic_id')::bigint;
  ELSE
    v_clinic_id := NULL;
  END IF;

  v_member_role := LOWER(NULLIF(COALESCE(meta->>'member_role', meta->>'role'), ''));
  IF v_member_role NOT IN ('owner', 'admin', 'doctor') THEN
    v_member_role := NULL;
  END IF;

  IF v_account = 'individual' THEN
    v_member_role := NULL;
    -- clinic_id metadata orqali saqlanadi (yakka stom self-service signup)
  END IF;

  INSERT INTO public.profiles (
    user_id, account_type, clinic_id, member_role, full_name, phone, email, role
  )
  VALUES (
    NEW.id,
    v_account,
    v_clinic_id,
    v_member_role,
    NULLIF(meta->>'full_name', ''),
    NULLIF(meta->>'phone', ''),
    NEW.email,
    -- Eski profiles.role NOT NULL bo'lishi mumkin — default 'doctor'
    CASE
      WHEN v_account = 'clinic_member' AND v_member_role = 'admin' THEN 'admin'
      WHEN v_account = 'clinic_member' AND v_member_role = 'owner' THEN 'admin'
      ELSE 'doctor'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. RLS helper funksiyalari — user_id = auth.uid() (UUID)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_account_type()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT account_type FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_profile_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 5. profiles RLS — user_id orqali (bigint id emas!)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: read own" ON public.profiles;
CREATE POLICY "Profiles: read own"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles: clinic members read same clinic" ON public.profiles;
CREATE POLICY "Profiles: clinic members read same clinic"
  ON public.profiles FOR SELECT
  USING (
    account_type = 'clinic_member'
    AND clinic_id IS NOT NULL
    AND clinic_id = public.current_clinic_id()
    AND user_id IS NOT NULL
  );

-- =============================================================================
-- TEKSHIRUV:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'profiles' ORDER BY ordinal_position;
--
--   Signup dan keyin:
--   SELECT id, user_id, account_type, email FROM public.profiles
--   ORDER BY created_at DESC LIMIT 5;
-- =============================================================================
