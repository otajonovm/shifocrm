-- =============================================================================
-- Bridge 1-bosqich: doctors → employees (legacy_doctor_id ko'prigi)
-- Kalendar doctors jadvalida qoladi; Xodimlar bo'limi employees dan o'qiydi.
--
-- TARTIB:
--   1) SUPABASE_RBAC_EMPLOYEES.sql (agar employees jadvali yo'q bo'lsa)
--   2) SUPABASE_EMPLOYEES_CLINIC_INTEGRATION.sql
--   3) Ushbu fayl
-- =============================================================================

-- Ko'prik ustuni: employees.legacy_doctor_id = doctors.id (INTEGER)
ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS legacy_doctor_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_legacy_doctor_id
  ON public.employees(legacy_doctor_id)
  WHERE legacy_doctor_id IS NOT NULL;

COMMENT ON COLUMN public.employees.legacy_doctor_id IS
  'Eski doctors jadvali bilan bog''lanish (kalendar, qabullar, tashriflar FK)';

-- Kreslo matnini INT ga (1-4)
CREATE OR REPLACE FUNCTION public.parse_chair_number_to_int(p_value TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT := lower(trim(coalesce(p_value, '')));
BEGIN
  IF v = '' THEN RETURN NULL; END IF;
  IF v ~ 'xirurg' THEN RETURN 4; END IF;
  IF v ~ '^[0-9]+$' THEN
    RETURN LEAST(GREATEST(v::INTEGER, 1), 4);
  END IF;
  IF v ~ '1' THEN RETURN 1; END IF;
  IF v ~ '2' THEN RETURN 2; END IF;
  IF v ~ '3' THEN RETURN 3; END IF;
  RETURN 1;
END;
$$;

-- doctors.specialization → employees.role
CREATE OR REPLACE FUNCTION public.map_doctor_specialty_to_role(p_specialty TEXT)
RETURNS public.user_role
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE trim(coalesce(p_specialty, ''))
    WHEN 'Administrator (Reception)' THEN 'administrator'::public.user_role
    WHEN 'Assistent (Yordamchi)' THEN 'assistant'::public.user_role
    WHEN 'Kassir/Buxgalter' THEN 'cashier'::public.user_role
    ELSE 'doctor'::public.user_role
  END;
$$;

-- work_schedule JSONB → doctor_schedules qatorlari
CREATE OR REPLACE FUNCTION public.migrate_work_schedule_for_employee(
  p_employee_id UUID,
  p_work_schedule JSONB,
  p_fallback_chair TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_days JSONB;
  v_day_key TEXT;
  v_day JSONB;
  v_chair INT;
  v_dow INT;
  v_start TIME;
  v_end TIME;
  v_inserted INT := 0;
BEGIN
  IF p_employee_id IS NULL THEN RETURN 0; END IF;

  -- Mavjud jadvalni qayta migratsiya qilmaslik
  IF EXISTS (SELECT 1 FROM public.doctor_schedules WHERE doctor_id = p_employee_id LIMIT 1) THEN
    RETURN 0;
  END IF;

  v_chair := public.parse_chair_number_to_int(
    coalesce(p_work_schedule->>'chair_number', p_fallback_chair)
  );
  IF v_chair IS NULL THEN v_chair := 1; END IF;

  v_days := p_work_schedule->'days';
  IF v_days IS NULL OR jsonb_typeof(v_days) <> 'object' THEN
    RETURN 0;
  END IF;

  FOR v_day_key, v_day IN SELECT key, value FROM jsonb_each(v_days)
  LOOP
    IF coalesce((v_day->>'enabled')::BOOLEAN, false) IS NOT TRUE THEN
      CONTINUE;
    END IF;

    v_dow := CASE v_day_key
      WHEN 'mon' THEN 1 WHEN 'tue' THEN 2 WHEN 'wed' THEN 3
      WHEN 'thu' THEN 4 WHEN 'fri' THEN 5 WHEN 'sat' THEN 6
      ELSE NULL
    END;
    IF v_dow IS NULL THEN CONTINUE; END IF;

    BEGIN
      v_start := (v_day->>'start')::TIME;
      v_end := (v_day->>'end')::TIME;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    IF v_start IS NULL OR v_end IS NULL OR v_start >= v_end THEN
      CONTINUE;
    END IF;

    INSERT INTO public.doctor_schedules (
      doctor_id, day_of_week, start_time, end_time, chair_number
    ) VALUES (
      p_employee_id, v_dow, v_start, v_end, v_chair
    )
    ON CONFLICT DO NOTHING;

    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1) doctors → employees (faqat hali ko'chirilmaganlar)
-- -----------------------------------------------------------------------------
INSERT INTO public.employees (
  full_name,
  phone,
  email,
  password,
  specialty,
  role,
  salary_percentage,
  is_active,
  clinic_id,
  legacy_doctor_id,
  created_at,
  updated_at
)
SELECT
  d.full_name,
  d.phone,
  d.email,
  d.password,
  d.specialization,
  public.map_doctor_specialty_to_role(d.specialization),
  d.salary_percentage,
  COALESCE(d.is_active, true),
  d.clinic_id,
  d.id,
  COALESCE(d.created_at, NOW()),
  COALESCE(d.updated_at, NOW())
FROM public.doctors d
WHERE NOT EXISTS (
  SELECT 1 FROM public.employees e WHERE e.legacy_doctor_id = d.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.phone IS NOT NULL
    AND d.phone IS NOT NULL
    AND trim(e.phone) = trim(d.phone)
);

-- -----------------------------------------------------------------------------
-- 2) Ruxsatlar: doctors JSONB → employee_permissions (ustunlar bo'lsa)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'module_permissions'
  ) THEN
    UPDATE public.employee_permissions ep
    SET module_permissions = d.module_permissions
    FROM public.employees e
    JOIN public.doctors d ON d.id = e.legacy_doctor_id
    WHERE ep.employee_id = e.id
      AND d.module_permissions IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'data_permissions'
  ) THEN
    UPDATE public.employee_permissions ep
    SET
      can_view_revenue = COALESCE((d.data_permissions->>'can_view_revenue')::BOOLEAN, ep.can_view_revenue),
      can_export_data = COALESCE((d.data_permissions->>'can_export_data')::BOOLEAN, ep.can_export_data),
      can_edit_prices = COALESCE((d.data_permissions->>'can_edit_prices')::BOOLEAN, ep.can_edit_prices),
      can_manage_medical_records = COALESCE((d.data_permissions->>'can_manage_medical_records')::BOOLEAN, ep.can_manage_medical_records),
      can_allow_debt_treatment = COALESCE((d.data_permissions->>'can_allow_debt_treatment')::BOOLEAN, ep.can_allow_debt_treatment)
    FROM public.employees e
    JOIN public.doctors d ON d.id = e.legacy_doctor_id
    WHERE ep.employee_id = e.id
      AND d.data_permissions IS NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Ish grafigi: work_schedule / chair_number → doctor_schedules
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_schedule JSONB;
  v_chair TEXT;
BEGIN
  FOR r IN
    SELECT e.id AS employee_id, d.work_schedule, d.chair_number
    FROM public.employees e
    JOIN public.doctors d ON d.id = e.legacy_doctor_id
  LOOP
    v_schedule := r.work_schedule;
    v_chair := r.chair_number::TEXT;

    IF v_schedule IS NULL AND v_chair IS NOT NULL THEN
      v_schedule := jsonb_build_object('chair_number', v_chair, 'days', '{}'::JSONB);
    END IF;

    IF v_schedule IS NOT NULL THEN
      PERFORM public.migrate_work_schedule_for_employee(r.employee_id, v_schedule, v_chair);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Tekshirish
-- -----------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.doctors) AS doctors_count,
  (SELECT COUNT(*) FROM public.employees WHERE legacy_doctor_id IS NOT NULL) AS migrated_employees_count;

SELECT e.legacy_doctor_id, e.full_name, e.specialty, e.clinic_id
FROM public.employees e
WHERE e.legacy_doctor_id IS NOT NULL
ORDER BY e.legacy_doctor_id;
