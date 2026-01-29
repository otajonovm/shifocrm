-- Tenant isolation: ombor, xizmatlar, visit_services, income viewlari.
-- Iltimos, avval SUPABASE_TENANT_ISOLATION.sql ni ishlatib, clinics + patients/visits/payments ga clinic_id qo'shilgan bo'lsin.

-- 1. INVENTORY_ITEMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.inventory_items ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON public.inventory_items(clinic_id);

-- 2. INVENTORY_MOVEMENTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_movements' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.inventory_movements ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_clinic_id ON public.inventory_movements(clinic_id);

-- 3. EXPENSES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.expenses ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON public.expenses(clinic_id);

-- 4. INVENTORY_CONSUMPTIONS + trigger yangilash
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_consumptions' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.inventory_consumptions ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_clinic_id ON public.inventory_consumptions(clinic_id);

-- Trigger: movement yaratishda clinic_id qo'shish (consumption yoki visit orqali)
CREATE OR REPLACE FUNCTION handle_inventory_consumption()
RETURNS TRIGGER AS $$
DECLARE
  cid BIGINT;
BEGIN
  cid := NEW.clinic_id;
  IF cid IS NULL THEN
    SELECT v.clinic_id INTO cid FROM public.visits v WHERE v.id = NEW.visit_id LIMIT 1;
  END IF;
  INSERT INTO inventory_movements (item_id, type, quantity, note, visit_id, doctor_id, created_by, created_at, clinic_id)
  VALUES (
    NEW.item_id, 'out', NEW.quantity, COALESCE(NEW.note, 'Consumption'),
    NEW.visit_id, NEW.doctor_id, COALESCE(NEW.doctor_id::TEXT, NULL), NOW(), cid
  );
  UPDATE inventory_items SET current_stock = COALESCE(current_stock, 0) - NEW.quantity WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. VISIT_SERVICES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visit_services' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.visit_services ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_visit_services_clinic_id ON public.visit_services(clinic_id);

-- 6. SERVICES (agar jadval mavjud bo'lsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'clinic_id') THEN
      ALTER TABLE public.services ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON public.services(clinic_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 7. SERVICE_PACKAGES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_packages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'clinic_id') THEN
      ALTER TABLE public.service_packages ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_service_packages_clinic_id ON public.service_packages(clinic_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 8. SERVICE_PACKAGE_ITEMS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_package_items') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_package_items' AND column_name = 'clinic_id') THEN
      ALTER TABLE public.service_package_items ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_service_package_items_clinic_id ON public.service_package_items(clinic_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 9. DISCOUNT_RULES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discount_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discount_rules' AND column_name = 'clinic_id') THEN
      ALTER TABLE public.discount_rules ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_discount_rules_clinic_id ON public.discount_rules(clinic_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 10. BACKFILL (default clinic)
DO $$
DECLARE
  default_id BIGINT;
BEGIN
  SELECT id INTO default_id FROM public.clinics WHERE slug = 'default' LIMIT 1;
  IF default_id IS NOT NULL THEN
    UPDATE public.inventory_items     SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.inventory_movements SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.expenses            SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.inventory_consumptions c SET clinic_id = (SELECT v.clinic_id FROM public.visits v WHERE v.id = c.visit_id LIMIT 1) WHERE c.clinic_id IS NULL;
    UPDATE public.visit_services vs   SET clinic_id = (SELECT v.clinic_id FROM public.visits v WHERE v.id = vs.visit_id LIMIT 1) WHERE vs.clinic_id IS NULL;
  END IF;
END $$;

DO $$
DECLARE default_id BIGINT;
BEGIN
  SELECT id INTO default_id FROM public.clinics WHERE slug = 'default' LIMIT 1;
  IF default_id IS NOT NULL THEN
    UPDATE public.services         SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.service_packages SET clinic_id = default_id WHERE clinic_id IS NULL;
    UPDATE public.discount_rules   SET clinic_id = default_id WHERE clinic_id IS NULL;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  UPDATE public.service_package_items spi
  SET clinic_id = (SELECT sp.clinic_id FROM public.service_packages sp WHERE sp.id = spi.package_id LIMIT 1)
  WHERE spi.clinic_id IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- 11. INCOME VIEWLAR — clinic_id bo'yicha (avval DROP, ustun o'zgarganda REPLACE ishlamaydi)
DROP VIEW IF EXISTS public.income_daily;
CREATE VIEW public.income_daily AS
SELECT
  p.clinic_id,
  DATE(p.paid_at) AS day,
  COALESCE(SUM(CASE WHEN p.payment_type = 'payment' THEN p.amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN p.payment_type = 'refund' THEN p.amount ELSE 0 END), 0) AS total_refunds,
  COALESCE(SUM(CASE WHEN p.payment_type = 'adjustment' THEN p.amount ELSE 0 END), 0) AS total_adjustments,
  COALESCE(SUM(CASE WHEN p.payment_type = 'refund' THEN -p.amount ELSE p.amount END), 0) AS net_income
FROM public.payments p
WHERE p.clinic_id IS NOT NULL
GROUP BY p.clinic_id, DATE(p.paid_at)
ORDER BY p.clinic_id, day DESC;

DROP VIEW IF EXISTS public.income_monthly;
CREATE VIEW public.income_monthly AS
SELECT
  p.clinic_id,
  DATE_TRUNC('month', p.paid_at)::DATE AS month,
  COALESCE(SUM(CASE WHEN p.payment_type = 'payment' THEN p.amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN p.payment_type = 'refund' THEN p.amount ELSE 0 END), 0) AS total_refunds,
  COALESCE(SUM(CASE WHEN p.payment_type = 'adjustment' THEN p.amount ELSE 0 END), 0) AS total_adjustments,
  COALESCE(SUM(CASE WHEN p.payment_type = 'refund' THEN -p.amount ELSE p.amount END), 0) AS net_income
FROM public.payments p
WHERE p.clinic_id IS NOT NULL
GROUP BY p.clinic_id, DATE_TRUNC('month', p.paid_at)
ORDER BY p.clinic_id, month DESC;

-- 12. SERVICE REVENUE / TOP_SERVICES VIEWLAR (visit_services + visits orqali)
DROP VIEW IF EXISTS public.service_revenue_daily;
CREATE VIEW public.service_revenue_daily AS
SELECT
  v.clinic_id,
  DATE(vs.created_at) AS day,
  vs.service_name,
  COALESCE(SUM(vs.price), 0) AS total_revenue
FROM public.visit_services vs
JOIN public.visits v ON v.id = vs.visit_id
WHERE v.clinic_id IS NOT NULL
GROUP BY v.clinic_id, DATE(vs.created_at), vs.service_name
ORDER BY v.clinic_id, day DESC, total_revenue DESC;

DROP VIEW IF EXISTS public.service_revenue_monthly;
CREATE VIEW public.service_revenue_monthly AS
SELECT
  v.clinic_id,
  DATE_TRUNC('month', vs.created_at)::DATE AS month,
  vs.service_name,
  COALESCE(SUM(vs.price), 0) AS total_revenue
FROM public.visit_services vs
JOIN public.visits v ON v.id = vs.visit_id
WHERE v.clinic_id IS NOT NULL
GROUP BY v.clinic_id, DATE_TRUNC('month', vs.created_at), vs.service_name
ORDER BY v.clinic_id, month DESC, total_revenue DESC;

DROP VIEW IF EXISTS public.top_services;
CREATE VIEW public.top_services AS
SELECT
  v.clinic_id,
  vs.service_name,
  COALESCE(SUM(vs.price), 0) AS total_revenue
FROM public.visit_services vs
JOIN public.visits v ON v.id = vs.visit_id
WHERE v.clinic_id IS NOT NULL
GROUP BY v.clinic_id, vs.service_name
ORDER BY v.clinic_id, total_revenue DESC;
