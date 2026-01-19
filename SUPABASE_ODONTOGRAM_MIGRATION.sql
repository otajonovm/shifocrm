-- Odontograms Table Migration for Supabase
-- Odontogramma (tish xaritasi) snapshot'lari uchun jadval

-- 1. Odontograms jadvalini yaratish
CREATE TABLE IF NOT EXISTS odontograms (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{"teeth": {}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id) -- Har bir visit uchun faqat bitta odontogramma
);

-- 2. Indexlar yaratish
CREATE INDEX IF NOT EXISTS idx_odontograms_patient_id ON odontograms(patient_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_visit_id ON odontograms(visit_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_doctor_id ON odontograms(doctor_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_created_at ON odontograms(created_at DESC);

-- 3. JSONB index (tez qidiruv uchun)
CREATE INDEX IF NOT EXISTS idx_odontograms_data ON odontograms USING GIN (data);

-- 4. Updated_at avtomatik yangilanish trigger
CREATE OR REPLACE FUNCTION update_odontograms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_odontograms_updated_at ON odontograms;
CREATE TRIGGER trigger_update_odontograms_updated_at
  BEFORE UPDATE ON odontograms
  FOR EACH ROW
  EXECUTE FUNCTION update_odontograms_updated_at();

-- 5. Row Level Security (RLS) - Public Access
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;

-- Barcha CRUD operatsiyalar uchun public access
CREATE POLICY "Public can view all odontograms"
  ON odontograms FOR SELECT
  USING (true);

CREATE POLICY "Public can insert odontograms"
  ON odontograms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update odontograms"
  ON odontograms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete odontograms"
  ON odontograms FOR DELETE
  USING (true);

-- 6. 5 xonali unique ID generatsiya funksiyasi (10000-99999)
CREATE OR REPLACE FUNCTION generate_odontogram_id()
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
  exists_check INTEGER;
BEGIN
  LOOP
    new_id := 10000 + FLOOR(RANDOM() * 90000)::INTEGER;
    SELECT COUNT(*) INTO exists_check FROM odontograms WHERE id = new_id;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Default ID generatsiya (agar INSERT da id berilmasa)
CREATE OR REPLACE FUNCTION set_odontogram_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := generate_odontogram_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_odontogram_id ON odontograms;
CREATE TRIGGER trigger_set_odontogram_id
  BEFORE INSERT ON odontograms
  FOR EACH ROW
  WHEN (NEW.id IS NULL)
  EXECUTE FUNCTION set_odontogram_id();

-- 8. Data validation (ixtiyoriy - JSONB struktura tekshiruvi)
CREATE OR REPLACE FUNCTION validate_odontogram_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Data JSONB va teeth maydoni mavjudligini tekshirish
  IF NEW.data IS NULL OR NOT (NEW.data ? 'teeth') THEN
    RAISE EXCEPTION 'Odontogram data must contain "teeth" field';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_odontogram_data ON odontograms;
CREATE TRIGGER trigger_validate_odontogram_data
  BEFORE INSERT OR UPDATE ON odontograms
  FOR EACH ROW
  EXECUTE FUNCTION validate_odontogram_data();

-- 9. Comments (hujjatlashtirish)
COMMENT ON TABLE odontograms IS 'Bemorlar tashriflari uchun odontogramma (tish xaritasi) snapshot''lari';
COMMENT ON COLUMN odontograms.id IS '5 xonali unique ID (10000-99999)';
COMMENT ON COLUMN odontograms.patient_id IS 'Bemor ID (patients jadvalidan)';
COMMENT ON COLUMN odontograms.visit_id IS 'Tashrif ID (visits jadvalidan) - unique';
COMMENT ON COLUMN odontograms.data IS 'JSONB formatida tishlar ma''lumotlari: {"teeth": {"11": {"state": "healthy", "note": ""}, ...}}';
COMMENT ON COLUMN odontograms.data IS 'Tish holatlari: healthy, caries, filled, missing, crown, root_canal';
