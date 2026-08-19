-- Yakka doktor Auth signup: handle_new_user trigger Auth insert ni yiqitmasin.

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
  v_role        TEXT;
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
  END IF;

  v_role := CASE
    WHEN v_account = 'clinic_member' AND v_member_role = 'admin' THEN 'admin'
    WHEN v_account = 'clinic_member' AND v_member_role = 'owner' THEN 'admin'
    ELSE 'doctor'
  END;

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
    v_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.profiles
    SET
      user_id = COALESCE(user_id, NEW.id),
      clinic_id = COALESCE(clinic_id, v_clinic_id),
      full_name = COALESCE(NULLIF(meta->>'full_name', ''), full_name),
      phone = COALESCE(NULLIF(meta->>'phone', ''), phone)
    WHERE email = NEW.email
      AND (user_id IS NULL OR user_id = NEW.id);
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;
