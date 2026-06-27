-- Xizmat paketlari va chegirma qoidalari (UI uchun)

CREATE TABLE IF NOT EXISTS public.service_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  package_price NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_package_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  package_id BIGINT NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS public.discount_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('fixed', 'percent')),
  discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  scope VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (scope IN ('service', 'category', 'package', 'visit_total')),
  scope_ref TEXT,
  min_amount NUMERIC(12, 2),
  min_services_count INTEGER,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_clinic_id ON public.service_packages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_package_items_package_id ON public.service_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_clinic_id ON public.discount_rules(clinic_id);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "sp_select" ON public.service_packages FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sp_insert" ON public.service_packages FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sp_update" ON public.service_packages FOR UPDATE USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sp_delete" ON public.service_packages FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "spi_select" ON public.service_package_items FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "spi_insert" ON public.service_package_items FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "spi_delete" ON public.service_package_items FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "dr_select" ON public.discount_rules FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dr_insert" ON public.discount_rules FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dr_update" ON public.discount_rules FOR UPDATE USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dr_delete" ON public.discount_rules FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Narx audit trigger: base_price ustunini qo'llab-quvvatlash
CREATE OR REPLACE FUNCTION public.log_service_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(OLD.base_price, OLD.price) IS DISTINCT FROM COALESCE(NEW.base_price, NEW.price) THEN
    INSERT INTO public.service_price_audit (clinic_id, service_id, service_name, old_price, new_price, changed_at)
    VALUES (
      COALESCE(NEW.clinic_id, OLD.clinic_id),
      NEW.id,
      COALESCE(NEW.name, NEW.service_name, OLD.name, OLD.service_name, ''),
      COALESCE(OLD.base_price, OLD.price),
      COALESCE(NEW.base_price, NEW.price),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
