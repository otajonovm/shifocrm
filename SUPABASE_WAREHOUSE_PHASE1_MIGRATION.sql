-- Phase 1: Aqlli Ombor Nazorati (ko'p xonali klinikalar)
-- clinic_inventory + inventory_logs

CREATE TABLE IF NOT EXISTS public.clinic_inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'dona',
  current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) DEFAULT 0,
  sku TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES public.clinic_inventory(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  reason TEXT,
  stock_before NUMERIC(12, 2),
  stock_after NUMERIC(12, 2),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_clinic_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinic_inventory_updated_at ON public.clinic_inventory;
CREATE TRIGGER trigger_clinic_inventory_updated_at
  BEFORE UPDATE ON public.clinic_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_inventory_updated_at();

CREATE INDEX IF NOT EXISTS idx_clinic_inventory_clinic_id ON public.clinic_inventory(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_inventory_category ON public.clinic_inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_clinic_id ON public.inventory_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item_id ON public.inventory_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

ALTER TABLE public.clinic_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view clinic_inventory"
    ON public.clinic_inventory FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can insert clinic_inventory"
    ON public.clinic_inventory FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can update clinic_inventory"
    ON public.clinic_inventory FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can delete clinic_inventory"
    ON public.clinic_inventory FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view inventory_logs"
    ON public.inventory_logs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can insert inventory_logs"
    ON public.inventory_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bemor tashrifi (MED-ID / odontogramma) bilan bog'lash
ALTER TABLE public.inventory_logs
  ADD COLUMN IF NOT EXISTS visit_id BIGINT REFERENCES public.visits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_id BIGINT REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_inventory_logs_visit_id ON public.inventory_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_patient_id ON public.inventory_logs(patient_id);
