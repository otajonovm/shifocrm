-- Xizmat → ombor materiallari retsepti (Aqlli Hizmatlar Phase 2)

CREATE TABLE IF NOT EXISTS public.service_materials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  inventory_item_id BIGINT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_materials_clinic_id ON public.service_materials(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_service_id ON public.service_materials(service_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_item_id ON public.service_materials(inventory_item_id);

ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can view service_materials"
    ON public.service_materials FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can insert service_materials"
    ON public.service_materials FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can update service_materials"
    ON public.service_materials FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can delete service_materials"
    ON public.service_materials FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
