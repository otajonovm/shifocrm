-- 0-qadam: patients va doctors jadvallari (baza bo'sh bo'lsa ishlating).
-- clinic_id keyinroq SUPABASE_SUPER_ADMIN_MIGRATION (doctors) va SUPABASE_TENANT_ISOLATION (patients) da qo'shiladi.

-- PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id INTEGER PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  doctor_id INTEGER,
  doctor_name TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  last_visit DATE,
  next_appointment DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);

-- DOCTORS (clinic_id keyinroq SUPER_ADMIN_MIGRATION da qo'shiladi)
CREATE TABLE IF NOT EXISTS public.doctors (
  id INTEGER PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_created_at ON public.doctors(created_at DESC);

-- updated_at trigger (patients)
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON public.patients;
CREATE TRIGGER trigger_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE PROCEDURE update_patients_updated_at();

-- updated_at trigger (doctors)
CREATE OR REPLACE FUNCTION update_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctors_updated_at ON public.doctors;
CREATE TRIGGER trigger_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE PROCEDURE update_doctors_updated_at();

-- RLS (anon key bilan ishlash uchun)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public patients" ON public.patients;
CREATE POLICY "Public patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public doctors" ON public.doctors;
CREATE POLICY "Public doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
