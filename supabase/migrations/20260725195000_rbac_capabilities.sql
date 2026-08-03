BEGIN;

-- Expand staff permission matrix with finance/schedule capability keys used by UI + RLS helpers.
-- employee_permissions.permissions remains the source of truth (JSONB).

CREATE OR REPLACE FUNCTION public.current_employee_has(p_section TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims JSONB := public.current_app_claims();
  perms JSONB;
  role_name TEXT;
BEGIN
  IF COALESCE((claims ->> 'is_global_super_admin')::BOOLEAN, FALSE)
     OR COALESCE((claims ->> 'is_clinic_owner')::BOOLEAN, FALSE) THEN
    RETURN TRUE;
  END IF;

  role_name := LOWER(COALESCE(claims ->> 'role', ''));
  IF role_name IN ('administrator', 'admin', 'clinic_admin', 'clinic_owner', 'super_admin') THEN
    RETURN TRUE;
  END IF;
  IF role_name = 'chief_doctor' AND p_section IN (
    'patients', 'appointments', 'treatment_plans', 'reports', 'staff', 'dashboard'
  ) THEN
    RETURN TRUE;
  END IF;

  perms := COALESCE(claims -> 'permissions', '{}'::jsonb);
  IF jsonb_typeof(perms -> p_section) = 'object' THEN
    RETURN COALESCE((perms -> p_section ->> p_action)::BOOLEAN, FALSE);
  END IF;

  -- Flat capability keys: finance.view_clinic_profit etc.
  IF COALESCE((perms ->> (p_section || '.' || p_action))::BOOLEAN, FALSE) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

COMMIT;
