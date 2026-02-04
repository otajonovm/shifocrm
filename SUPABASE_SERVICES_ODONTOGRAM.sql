-- Odontogramma uchun xizmatlar: rang va ko'rsatish sozlamalari
-- services jadvaliga odontogram_color va show_in_odontogram ustunlari

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'show_in_odontogram') THEN
      ALTER TABLE public.services ADD COLUMN show_in_odontogram BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'odontogram_color') THEN
      ALTER TABLE public.services ADD COLUMN odontogram_color TEXT DEFAULT 'cyan';
    END IF;
  END IF;
END $$;
