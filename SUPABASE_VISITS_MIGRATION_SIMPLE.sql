-- Visits Table Migration for Supabase (Simple Version - Public Access)
-- Tashriflar jadvalini yaratish (anon key bilan ishlash uchun)

-- 1. Visits jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.visits (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  price NUMERIC(12, 2) DEFAULT NULL,
  paid_amount NUMERIC(12, 2) DEFAULT NULL,
  debt_amount NUMERIC(12, 2) DEFAULT NULL,
  service_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexlar yaratish (tez qidiruv uchun)
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON public.visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits(created_at DESC);

-- 3. Updated_at avtomatik yangilanish trigger
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visits_updated_at ON public.visits;
CREATE TRIGGER trigger_update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE PROCEDURE update_visits_updated_at();

-- 4. Debt_amount avtomatik hisoblash trigger
CREATE OR REPLACE FUNCTION calculate_visit_debt()
RETURNS TRIGGER AS $$
BEGIN
  -- Agar price va paid_amount mavjud bo'lsa, debt_amount ni hisobla
  IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
    NEW.debt_amount = GREATEST(0, NEW.price - COALESCE(NEW.paid_amount, 0));
    
    -- Agar debt_amount 0 bo'lsa va status completed_debt bo'lsa, completed_paid ga o'zgartir
    IF NEW.debt_amount = 0 AND NEW.status = 'completed_debt' THEN
      NEW.status = 'completed_paid';
      NEW.debt_amount = NULL;
    END IF;
    
    -- Agar debt_amount > 0 bo'lsa va status completed_paid bo'lsa, completed_debt ga o'zgartir
    IF NEW.debt_amount > 0 AND NEW.status = 'completed_paid' THEN
      NEW.status = 'completed_debt';
    END IF;
  ELSE
    -- Agar price yo'q bo'lsa, debt_amount ni null qil
    NEW.debt_amount = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_visit_debt ON public.visits;
CREATE TRIGGER trigger_calculate_visit_debt
  BEFORE INSERT OR UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE PROCEDURE calculate_visit_debt();

-- 5. Row Level Security (RLS) - Public Access
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Public can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Public can update visits" ON public.visits;
DROP POLICY IF EXISTS "Public can delete visits" ON public.visits;

CREATE POLICY "Public can view all visits"
  ON visits FOR SELECT
  USING (true);

CREATE POLICY "Public can insert visits"
  ON visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update visits"
  ON visits FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete visits"
  ON visits FOR DELETE
  USING (true);

-- 6. 5 xonali unique ID generatsiya funksiyasi (10000-99999)
CREATE OR REPLACE FUNCTION generate_visit_id()
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
  exists_check INTEGER;
BEGIN
  LOOP
    -- 10000 dan 99999 gacha random ID generatsiya qilish
    new_id := 10000 + FLOOR(RANDOM() * 90000)::INTEGER;
    
    -- ID mavjudligini tekshirish
    SELECT COUNT(*) INTO exists_check
    FROM public.visits
    WHERE id = new_id;
    
    -- Agar ID mavjud bo'lmasa, qaytarish
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Default ID generatsiya (agar INSERT da id berilmasa)
CREATE OR REPLACE FUNCTION set_visit_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := generate_visit_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_visit_id ON public.visits;
CREATE TRIGGER trigger_set_visit_id
  BEFORE INSERT ON public.visits
  FOR EACH ROW
  WHEN (NEW.id IS NULL)
  EXECUTE PROCEDURE set_visit_id();

-- 8. Comments (hujjatlashtirish)
COMMENT ON TABLE public.visits IS 'Bemorlar tashriflari jadvali';
COMMENT ON COLUMN public.visits.id IS '5 xonali unique ID (10000-99999)';
COMMENT ON COLUMN public.visits.patient_id IS 'Bemor ID (patients jadvalidan)';
COMMENT ON COLUMN public.visits.doctor_id IS 'Doktor ID (doctors jadvalidan)';
COMMENT ON COLUMN public.visits.status IS 'Tashrif statusi: pending, arrived, in_progress, completed_debt, completed_paid, cancelled, no_show, archived';
COMMENT ON COLUMN public.visits.price IS 'Xizmat narxi (so''m)';
COMMENT ON COLUMN public.visits.paid_amount IS 'To''langan summa (so''m)';
COMMENT ON COLUMN public.visits.debt_amount IS 'Qarzdorlik summasi (so''m) - avtomatik hisoblanadi: price - paid_amount';
