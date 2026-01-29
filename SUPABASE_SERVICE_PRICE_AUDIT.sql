-- service_price_audit: jadval yoki ustunlar yo'q bo'lsa 400 (Bad Request) keladi.
-- Bu skriptni Supabase Dashboard → SQL Editor da bitta marta ishlating.

-- 1. Jadval mavjud emas bo'lsa yaratish
CREATE TABLE IF NOT EXISTS public.service_price_audit (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_id BIGINT,
  service_name TEXT,
  old_price NUMERIC,
  new_price NUMERIC,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. clinic_id ustuni yo'q bo'lsa qo'shish
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_price_audit' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE public.service_price_audit
      ADD COLUMN clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. changed_at ustuni yo'q bo'lsa qo'shish
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_price_audit' AND column_name = 'changed_at'
  ) THEN
    ALTER TABLE public.service_price_audit
      ADD COLUMN changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 4. created_at ustuni yo'q bo'lsa qo'shish (ixtiyoriy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_price_audit' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.service_price_audit
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_price_audit_clinic_id ON public.service_price_audit(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_price_audit_changed_at ON public.service_price_audit(changed_at DESC);

-- 5. RLS (ixtiyoriy): klinika o'z audit qatorlarini ko'radi
ALTER TABLE public.service_price_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_price_audit_select" ON public.service_price_audit;
CREATE POLICY "service_price_audit_select" ON public.service_price_audit
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_price_audit_insert" ON public.service_price_audit;
CREATE POLICY "service_price_audit_insert" ON public.service_price_audit
  FOR INSERT WITH CHECK (true);

-- 6. Trigger: services jadvalida narx o'zgarganda service_price_audit ga yozish
CREATE OR REPLACE FUNCTION public.log_service_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.service_price_audit (clinic_id, service_id, service_name, old_price, new_price, changed_at)
    VALUES (
      COALESCE(NEW.clinic_id, OLD.clinic_id),
      NEW.id,
      COALESCE(NEW.name, NEW.service_name, OLD.name, OLD.service_name, ''),
      OLD.price,
      NEW.price,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_price_audit ON public.services;
CREATE TRIGGER trg_service_price_audit
  AFTER UPDATE ON public.services
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_service_price_change();
