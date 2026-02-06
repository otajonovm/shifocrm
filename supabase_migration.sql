-- ============================================
-- QO'SHIMCHA TO'LOVLAR UCHUN MIGRATION
-- ============================================
-- Bu SQL'ni Supabase Dashboard > SQL Editor'da ishga tushiring
-- Qo'shimcha to'lovlar uchun visit_id va patient_id ni nullable qilish

-- 1. Avval mavjud foreign key constraint'larni tekshirish va olib tashlash
DO $$ 
BEGIN
  -- visit_id foreign key constraint'ni olib tashlash (agar mavjud bo'lsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_visit_id_fkey' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_visit_id_fkey;
  END IF;
  
  -- patient_id foreign key constraint'ni olib tashlash (agar mavjud bo'lsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_patient_id_fkey' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_patient_id_fkey;
  END IF;
END $$;

-- 2. visit_id va patient_id ustunlarini nullable qilish
ALTER TABLE payments 
  ALTER COLUMN visit_id DROP NOT NULL,
  ALTER COLUMN patient_id DROP NOT NULL;

-- 3. Foreign key constraint'larni qayta qo'shish (agar kerak bo'lsa)
-- Agar sizda visits va patients jadvali bo'lsa va foreign key kerak bo'lsa:
-- ALTER TABLE payments 
--   ADD CONSTRAINT payments_visit_id_fkey 
--   FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL;
-- 
-- ALTER TABLE payments 
--   ADD CONSTRAINT payments_patient_id_fkey 
--   FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- 4. Tekshirish - quyidagi query natijasida is_nullable = 'YES' bo'lishi kerak
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('visit_id', 'patient_id', 'doctor_id');
