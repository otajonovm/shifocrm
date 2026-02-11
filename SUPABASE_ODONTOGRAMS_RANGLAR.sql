-- ============================================
-- ODONTOGRAMMA: TISHLAR RANGLARI SUPABASE'DA BARQAROR SAQLANISHI
-- ============================================
-- Bu buyruqlarni Supabase Dashboard > SQL Editor'da ishga tushiring.
-- Tish holatlari va ranglar data JSONB ustunida saqlanadi, yangilanishdan keyin o'chmaydi.

-- 1. Jadval mavjud bo'lmasa yaratish (clinic_id bilan)
CREATE TABLE IF NOT EXISTS odontograms (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  visit_id INTEGER NOT NULL,
  doctor_id INTEGER,
  clinic_id INTEGER,
  data JSONB NOT NULL DEFAULT '{"teeth": {}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id)
);

-- 2. Indexlar (tez qidiruv va filtrlash uchun)
CREATE INDEX IF NOT EXISTS idx_odontograms_patient_id ON odontograms(patient_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_visit_id ON odontograms(visit_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_clinic_id ON odontograms(clinic_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_data_gin ON odontograms USING GIN (data);

-- 3. updated_at avtomatik yangilanish
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
  EXECUTE PROCEDURE update_odontograms_updated_at();

-- 4. data.teeth struktura (kalitlar har doim string, masalan "11", "12")
-- data misoli: {"teeth": {"11": {"state": "caries", "service_id": 5, "note": ""}, "12": {"state": "filling", "service_id": null, "note": ""}}}
-- state: healthy | caries | filling | crown | root_canal | missing

-- 5. Tekshirish: jadval va ustunlar
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'odontograms'
ORDER BY ordinal_position;
