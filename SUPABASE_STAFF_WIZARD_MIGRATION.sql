-- Staff Wizard: employees kengaytirish, cash_registers, permissions JSONB matritsa
-- Supabase SQL Editor da bir marta ishga tushiring.

-- -----------------------------------------------------------------------------
-- 1. cash_registers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_clinic_id ON public.cash_registers(clinic_id);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App manage cash_registers" ON public.cash_registers;
CREATE POLICY "App manage cash_registers"
  ON public.cash_registers FOR ALL USING (true) WITH CHECK (true);

-- Har klinika uchun default kassa (mavjud klinikalarga)
INSERT INTO public.cash_registers (clinic_id, name, is_active)
SELECT c.id, 'Asosiy kassa', true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.cash_registers cr WHERE cr.clinic_id = c.id
);

-- -----------------------------------------------------------------------------
-- 2. employees ustunlari
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS middle_name TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS additional_phone TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS general_percentage NUMERIC DEFAULT 0;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS orthodontic_percentage NUMERIC DEFAULT 0;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS allowed_cash_register_id UUID
  REFERENCES public.cash_registers(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE IF EXISTS public.employees
  ADD COLUMN IF NOT EXISTS branch_ids UUID[] NOT NULL DEFAULT '{}';

-- full_name ni F.I.O dan to'ldirish (mavjud yozuvlar)
UPDATE public.employees
SET
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(
    last_name,
    NULLIF(trim(substring(full_name from position(' ' in full_name))), '')
  )
WHERE full_name IS NOT NULL
  AND (first_name IS NULL OR last_name IS NULL);

-- general_percentage ↔ salary_percentage sinxron
UPDATE public.employees
SET general_percentage = COALESCE(salary_percentage, 0)
WHERE general_percentage IS NULL OR general_percentage = 0;

UPDATE public.employees
SET salary_percentage = general_percentage
WHERE salary_percentage IS NULL AND general_percentage IS NOT NULL;

-- status ↔ is_active sinxron
UPDATE public.employees
SET status = CASE WHEN is_active = false THEN 'inactive' ELSE 'active' END
WHERE status IS NULL OR status = '';

-- Telefon takrorlanmasligi (klinika bo'yicha)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_clinic_phone_unique
  ON public.employees(clinic_id, phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- full_name avtomatik yangilash
CREATE OR REPLACE FUNCTION public.sync_employee_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL OR NEW.middle_name IS NOT NULL THEN
    NEW.full_name := trim(concat_ws(' ',
      NULLIF(trim(NEW.last_name), ''),
      NULLIF(trim(NEW.first_name), ''),
      NULLIF(trim(NEW.middle_name), '')
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_employee_full_name ON public.employees;
CREATE TRIGGER trigger_sync_employee_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name, middle_name
  ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_full_name();

-- status ↔ is_active sinxron trigger
CREATE OR REPLACE FUNCTION public.sync_employee_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.is_active := (NEW.status = 'active');
    ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.status := CASE WHEN NEW.is_active = false THEN 'inactive' ELSE 'active' END;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status IS NOT NULL THEN
      NEW.is_active := (NEW.status = 'active');
    ELSE
      NEW.status := CASE WHEN NEW.is_active = false THEN 'inactive' ELSE 'active' END;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.general_percentage IS NOT NULL THEN
      NEW.salary_percentage := NEW.general_percentage;
    ELSIF NEW.salary_percentage IS NOT NULL THEN
      NEW.general_percentage := COALESCE(NEW.salary_percentage, 0);
    END IF;
  ELSE
    IF NEW.general_percentage IS DISTINCT FROM OLD.general_percentage THEN
      NEW.salary_percentage := NEW.general_percentage;
    ELSIF NEW.salary_percentage IS DISTINCT FROM OLD.salary_percentage THEN
      NEW.general_percentage := COALESCE(NEW.salary_percentage, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_employee_status ON public.employees;
CREATE TRIGGER trigger_sync_employee_status
  BEFORE INSERT OR UPDATE OF status, is_active, general_percentage, salary_percentage
  ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_status();

-- -----------------------------------------------------------------------------
-- 3. employee_permissions.permissions JSONB matritsa
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.employee_permissions
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{
    "patients":   {"view": false, "create": false, "edit": false, "delete": false},
    "finances":   {"view": false, "create": false, "edit": false, "delete": false},
    "warehouse":  {"view": false, "create": false, "edit": false, "delete": false},
    "analytics":  {"view": false, "create": false, "edit": false, "delete": false},
    "settings":   {"view": false, "create": false, "edit": false, "delete": false}
  }'::jsonb;
