-- RBAC: employees, permissions, schedules, activity logs (single clinic)

-- -----------------------------------------------------------------------------
-- 1. ENUM: user_role
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin',
      'administrator',
      'doctor',
      'assistant',
      'cashier'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. employees
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  role public.user_role NOT NULL,
  salary_percentage NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_user_id_unique
  ON public.employees(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_employees_updated_at ON public.employees;
CREATE TRIGGER trigger_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employees_updated_at();

-- -----------------------------------------------------------------------------
-- 3. employee_permissions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_permissions (
  employee_id UUID PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  can_view_revenue BOOLEAN NOT NULL DEFAULT false,
  can_export_data BOOLEAN NOT NULL DEFAULT false,
  can_edit_prices BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_employee_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_employee_permissions_updated_at ON public.employee_permissions;
CREATE TRIGGER trigger_employee_permissions_updated_at
  BEFORE UPDATE ON public.employee_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_permissions_updated_at();

CREATE OR REPLACE FUNCTION public.seed_employee_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employee_permissions (
    employee_id,
    can_view_revenue,
    can_export_data,
    can_edit_prices
  ) VALUES (
    NEW.id,
    CASE
      WHEN NEW.role IN ('super_admin', 'administrator', 'cashier') THEN true
      ELSE false
    END,
    CASE
      WHEN NEW.role = 'super_admin' THEN true
      ELSE false
    END,
    CASE
      WHEN NEW.role IN ('super_admin', 'administrator') THEN true
      ELSE false
    END
  )
  ON CONFLICT (employee_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_employees_seed_permissions ON public.employees;
CREATE TRIGGER trigger_employees_seed_permissions
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_employee_permissions();

-- -----------------------------------------------------------------------------
-- 4. doctor_schedules
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  chair_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_schedules_unique
  ON public.doctor_schedules(doctor_id, day_of_week, start_time, end_time, chair_number);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON public.doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON public.doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_chair ON public.doctor_schedules(chair_number);

CREATE OR REPLACE FUNCTION public.update_doctor_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctor_schedules_updated_at ON public.doctor_schedules;
CREATE TRIGGER trigger_doctor_schedules_updated_at
  BEFORE UPDATE ON public.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_doctor_schedules_updated_at();

-- -----------------------------------------------------------------------------
-- 5. activity_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Helper functions for RLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id
  FROM public.employees e
  WHERE e.auth_user_id = auth.uid()
    AND e.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_employee_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.role
  FROM public.employees e
  WHERE e.auth_user_id = auth.uid()
    AND e.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.is_active = true
      AND e.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.is_active = true
      AND e.role IN ('super_admin', 'administrator')
  );
$$;

-- -----------------------------------------------------------------------------
-- 7. Activity log trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_employee_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_row_id UUID;
  v_old JSONB;
  v_new JSONB;
BEGIN
  v_action := TG_TABLE_NAME || ':' || TG_OP;
  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  -- Resolve row id across tables with different PK column names
  v_row_id := COALESCE(
    (v_new ->> 'id')::uuid,
    (v_old ->> 'id')::uuid,
    (v_new ->> 'employee_id')::uuid,
    (v_old ->> 'employee_id')::uuid
  );

  INSERT INTO public.activity_logs (employee_id, action, details)
  VALUES (
    public.current_employee_id(),
    v_action,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP,
      'row_id', v_row_id,
      'old', v_old,
      'new', v_new
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_employees_activity_log ON public.employees;
CREATE TRIGGER trigger_employees_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.log_employee_activity();

DROP TRIGGER IF EXISTS trigger_employee_permissions_activity_log ON public.employee_permissions;
CREATE TRIGGER trigger_employee_permissions_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_employee_activity();

DROP TRIGGER IF EXISTS trigger_doctor_schedules_activity_log ON public.doctor_schedules;
CREATE TRIGGER trigger_doctor_schedules_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.log_employee_activity();

-- -----------------------------------------------------------------------------
-- 8. RLS policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage employees" ON public.employees;
CREATE POLICY "Super admins manage employees"
  ON public.employees
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage employee permissions" ON public.employee_permissions;
CREATE POLICY "Super admins manage employee permissions"
  ON public.employee_permissions
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Admins manage doctor schedules"
  ON public.doctor_schedules
  FOR ALL
  USING (public.is_admin_or_super_admin())
  WITH CHECK (public.is_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins view activity logs" ON public.activity_logs;
CREATE POLICY "Super admins view activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins insert activity logs" ON public.activity_logs;
CREATE POLICY "Super admins insert activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (public.is_super_admin());
