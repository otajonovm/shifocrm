BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'chief_doctor';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'reception';

ALTER TABLE IF EXISTS public.clinic_owners ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE IF EXISTS public.clinic_admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE IF EXISTS public.doctors ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS public.app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  doctor_id BIGINT,
  app_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_active
  ON public.app_sessions(id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_app_session_valid()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_sessions s
    WHERE s.id = NULLIF(auth.jwt()->>'jti', '')::uuid
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
      AND s.clinic_id IS NOT DISTINCT FROM
        NULLIF(auth.jwt()->>'clinic_id', '')::bigint
  )
$$;

CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt()->>'clinic_id', '')::bigint
$$;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt()->>'employee_id', '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt()->>'doctor_id', '')::bigint
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'app_role', '')
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_owner_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_app_role() IN ('superadmin', 'clinic_owner', 'solo', 'admin')
$$;

CREATE OR REPLACE FUNCTION public.current_employee_has(
  p_section TEXT,
  p_action TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.current_app_session_valid() THEN FALSE
    WHEN public.is_clinic_owner_role() THEN TRUE
    ELSE COALESCE((
      SELECT (ep.permissions #>> ARRAY[p_section, p_action])::boolean
      FROM public.employee_permissions ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE ep.employee_id = public.current_employee_id()
        AND e.clinic_id = public.current_clinic_id()
        AND e.is_active = TRUE
      LIMIT 1
    ), FALSE)
  END
$$;

REVOKE ALL ON FUNCTION public.current_app_session_valid() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_employee_has(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_session_valid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinic_owner_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_has(TEXT, TEXT) TO authenticated;

DO $$
DECLARE
  t TEXT;
  p RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients','visits','payments','odontograms','visit_services',
    'employees','employee_permissions','clinic_inventory','inventory_logs',
    'inventory_items','inventory_movements','inventory_consumptions',
    'appointments','cash_shifts','service_materials','treatment_plans',
    'expenses','import_jobs'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY patients_select_scope ON public.patients
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND (
    public.is_clinic_owner_role()
    OR public.current_app_role() IN ('chief_doctor', 'reception', 'cashier', 'assistant')
    OR doctor_id = public.current_doctor_id()
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = public.current_doctor_id()
        AND d.clinic_id = public.current_clinic_id()
        AND d.patients_scope = 'all'
    )
  )
);
CREATE POLICY patients_insert_scope ON public.patients
FOR INSERT TO authenticated
WITH CHECK (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'create')
);
CREATE POLICY patients_update_scope ON public.patients
FOR UPDATE TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'edit')
)
WITH CHECK (clinic_id = public.current_clinic_id());
CREATE POLICY patients_delete_scope ON public.patients
FOR DELETE TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'delete')
);

CREATE POLICY visits_select_scope ON public.visits
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND (
    public.current_employee_has('appointments', 'view')
    OR doctor_id = public.current_doctor_id()
  )
);
CREATE POLICY visits_insert_scope ON public.visits
FOR INSERT TO authenticated
WITH CHECK (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('appointments', 'create')
);
CREATE POLICY visits_update_scope ON public.visits
FOR UPDATE TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND (
    public.current_employee_has('appointments', 'edit')
    OR doctor_id = public.current_doctor_id()
  )
)
WITH CHECK (clinic_id = public.current_clinic_id());

CREATE POLICY payments_select_scope ON public.payments
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND (
    public.current_employee_has('finance', 'view_clinic')
    OR doctor_id = public.current_doctor_id()
  )
);

CREATE POLICY clinical_select_scope ON public.odontograms
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'view')
);
CREATE POLICY clinical_insert_scope ON public.odontograms
FOR INSERT TO authenticated
WITH CHECK (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'edit')
);
CREATE POLICY clinical_update_scope ON public.odontograms
FOR UPDATE TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'edit')
)
WITH CHECK (clinic_id = public.current_clinic_id());

CREATE POLICY visit_services_select_scope ON public.visit_services
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'view')
);
CREATE POLICY visit_services_write_scope ON public.visit_services
FOR ALL TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'edit')
)
WITH CHECK (
  clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'edit')
);

CREATE POLICY employees_select_scope ON public.employees
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND (public.is_clinic_owner_role() OR id = public.current_employee_id())
);
CREATE POLICY employee_permissions_select_scope ON public.employee_permissions
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND (
    employee_id = public.current_employee_id()
    OR public.is_clinic_owner_role()
  )
);
CREATE POLICY employee_permissions_owner_write ON public.employee_permissions
FOR ALL TO authenticated
USING (public.current_app_session_valid() AND public.is_clinic_owner_role())
WITH CHECK (public.current_app_session_valid() AND public.is_clinic_owner_role());

DO $$
DECLARE
  t TEXT;
  section_name TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinic_inventory','inventory_logs','inventory_items','inventory_movements',
    'inventory_consumptions','service_materials'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING
       (public.current_app_session_valid() AND clinic_id = public.current_clinic_id()
        AND public.current_employee_has(''warehouse'',''view''))',
      t || '_select_scope', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING
       (public.current_app_session_valid() AND clinic_id = public.current_clinic_id()
        AND public.current_employee_has(''warehouse'',''edit''))
       WITH CHECK (clinic_id = public.current_clinic_id()
        AND public.current_employee_has(''warehouse'',''edit''))',
      t || '_write_scope', t
    );
  END LOOP;
END $$;

COMMIT;
