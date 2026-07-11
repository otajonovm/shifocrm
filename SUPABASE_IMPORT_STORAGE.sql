-- Vaqtinchalik import rasmlari (AI tahlildan keyin o'chiriladi)
-- Supabase SQL Editor da bir marta ishga tushiring.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'import-temp',
  'import-temp',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Import temp: authenticated upload" ON storage.objects;
CREATE POLICY "Import temp: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'import-temp');

DROP POLICY IF EXISTS "Import temp: authenticated delete" ON storage.objects;
CREATE POLICY "Import temp: authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'import-temp');

DROP POLICY IF EXISTS "Import temp: anon upload" ON storage.objects;
CREATE POLICY "Import temp: anon upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'import-temp');

DROP POLICY IF EXISTS "Import temp: anon delete" ON storage.objects;
CREATE POLICY "Import temp: anon delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'import-temp');
