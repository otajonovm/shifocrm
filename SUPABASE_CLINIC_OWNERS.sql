-- clinic_owners (klinika boshlig'i: clinic-scoped super admin)
-- clinics jadvali mavjud bo'lishi kerak.

CREATE TABLE IF NOT EXISTS public.clinic_owners (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id),
  UNIQUE (login)
);

CREATE INDEX IF NOT EXISTS idx_clinic_owners_clinic_id ON public.clinic_owners(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_owners_login ON public.clinic_owners(login);

-- updated_at trigger (optional)
CREATE OR REPLACE FUNCTION update_clinic_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinic_owners_updated_at ON public.clinic_owners;
CREATE TRIGGER trigger_clinic_owners_updated_at
  BEFORE UPDATE ON public.clinic_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_owners_updated_at();

-- Allow REST access (anon/authenticated) since app uses custom login
ALTER TABLE public.clinic_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public clinic owners" ON public.clinic_owners;
CREATE POLICY "Public clinic owners"
  ON public.clinic_owners
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_owners TO anon, authenticated;
