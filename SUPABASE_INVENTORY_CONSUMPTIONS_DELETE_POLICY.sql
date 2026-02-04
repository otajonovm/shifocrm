-- inventory_consumptions uchun DELETE policy (material sarfini o'chirish uchun)
-- Odontogrammada material sarfini o'chirish tugmasi ishlashi uchun bu faylni Supabase SQL Editor da ishga tushiring

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_consumptions' AND policyname = 'Public can delete inventory consumptions'
  ) THEN
    CREATE POLICY "Public can delete inventory consumptions"
      ON inventory_consumptions FOR DELETE
      USING (true);
  END IF;
END $$;
