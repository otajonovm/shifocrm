-- Visit services uchun DELETE policy (tahrirlash uchun)
-- Agar "Tozalash" yoki xizmatni o'zgartirishda xato bersa, bu faylni Supabase SQL Editor da ishga tushiring

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'visit_services' AND policyname = 'Public can delete visit services'
  ) THEN
    CREATE POLICY "Public can delete visit services"
      ON visit_services FOR DELETE
      USING (true);
  END IF;
END $$;
