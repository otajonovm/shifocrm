BEGIN;

-- Solo / shifokor ish turi: foiz, ijara yoki gibrid
CREATE TABLE IF NOT EXISTS public.doctor_billing_settings (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'percentage'
    CHECK (model IN ('percentage', 'rent', 'hybrid')),
  doctor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 40
    CHECK (doctor_percentage >= 0 AND doctor_percentage <= 100),
  rent_type TEXT DEFAULT 'monthly'
    CHECK (rent_type IS NULL OR rent_type IN ('daily', 'monthly')),
  rent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0
    CHECK (rent_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doctor_billing_settings_clinic_doctor UNIQUE (clinic_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_billing_settings_clinic
  ON public.doctor_billing_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_billing_settings_doctor
  ON public.doctor_billing_settings(doctor_id);

-- Tashrif bo'yicha xarajatlar (zubotexnik, material, boshqa)
CREATE TABLE IF NOT EXISTS public.visit_expenses (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  visit_id BIGINT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  doctor_id BIGINT REFERENCES public.doctors(id) ON DELETE SET NULL,
  patient_id BIGINT,
  category TEXT NOT NULL DEFAULT 'zubotexnik'
    CHECK (category IN ('zubotexnik', 'lab', 'material', 'other')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_expenses_clinic_visit
  ON public.visit_expenses(clinic_id, visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_expenses_clinic_doctor
  ON public.visit_expenses(clinic_id, doctor_id, created_at);

-- To'lovdan keyin saqlanadigan hisob-kitob snapshot
CREATE TABLE IF NOT EXISTS public.visit_settlements (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  visit_id BIGINT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  doctor_id BIGINT REFERENCES public.doctors(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  gross_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  expenses_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_after_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0,
  doctor_share NUMERIC(14, 2) NOT NULL DEFAULT 0,
  clinic_share NUMERIC(14, 2) NOT NULL DEFAULT 0,
  rent_allocated NUMERIC(14, 2) NOT NULL DEFAULT 0,
  doctor_percentage NUMERIC(5, 2),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_visit_settlements_visit UNIQUE (visit_id)
);

CREATE INDEX IF NOT EXISTS idx_visit_settlements_clinic_doctor
  ON public.visit_settlements(clinic_id, doctor_id, calculated_at);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_billing_settings_updated ON public.doctor_billing_settings;
CREATE TRIGGER trg_doctor_billing_settings_updated
  BEFORE UPDATE ON public.doctor_billing_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_visit_expenses_updated ON public.visit_expenses;
CREATE TRIGGER trg_visit_expenses_updated
  BEFORE UPDATE ON public.visit_expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_visit_settlements_updated ON public.visit_settlements;
CREATE TRIGGER trg_visit_settlements_updated
  BEFORE UPDATE ON public.visit_settlements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.doctor_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_billing_settings_tenant ON public.doctor_billing_settings;
CREATE POLICY doctor_billing_settings_tenant ON public.doctor_billing_settings
  FOR ALL TO anon, authenticated
  USING (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  )
  WITH CHECK (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  );

DROP POLICY IF EXISTS visit_expenses_tenant ON public.visit_expenses;
CREATE POLICY visit_expenses_tenant ON public.visit_expenses
  FOR ALL TO anon, authenticated
  USING (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  )
  WITH CHECK (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  );

DROP POLICY IF EXISTS visit_settlements_tenant ON public.visit_settlements;
CREATE POLICY visit_settlements_tenant ON public.visit_settlements
  FOR ALL TO anon, authenticated
  USING (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  )
  WITH CHECK (
    public.current_clinic_id() IS NULL
    OR clinic_id = public.current_clinic_id()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_billing_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_expenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_settlements TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.doctor_billing_settings_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.visit_expenses_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.visit_settlements_id_seq TO anon, authenticated;

COMMIT;
