-- employees jadvalini ShifoCRM UI bilan integratsiya (clinic_id, login, kengaytirilgan ruxsatlar)
-- Supabase SQL Editor da bir marta ishga tushiring.

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS fixed_salary_amount NUMERIC;

-- Bridge: kalendar/qabullar doctors.id bilan bog'langan
ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS legacy_doctor_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_legacy_doctor_id
  ON public.employees(legacy_doctor_id)
  WHERE legacy_doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_clinic_id ON public.employees(clinic_id);

ALTER TABLE IF EXISTS public.employee_permissions
  ADD COLUMN IF NOT EXISTS can_manage_medical_records BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.employee_permissions
  ADD COLUMN IF NOT EXISTS can_allow_debt_treatment BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.employee_permissions
  ADD COLUMN IF NOT EXISTS module_permissions JSONB DEFAULT NULL;

-- Frontend anon kalit bilan ishlashi uchun (keyinroq Auth + qattiq RLS ga o'tiladi)
DROP POLICY IF EXISTS "App manage employees" ON public.employees;
CREATE POLICY "App manage employees"
  ON public.employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "App manage employee permissions" ON public.employee_permissions;
CREATE POLICY "App manage employee permissions"
  ON public.employee_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "App manage doctor schedules" ON public.doctor_schedules;
CREATE POLICY "App manage doctor schedules"
  ON public.doctor_schedules FOR ALL USING (true) WITH CHECK (true);
