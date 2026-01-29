-- Faqat clinic_admins jadvali (404 xatoligi uchun).
-- Shart: clinics jadvali mavjud bo'lishi kerak. Agar yo'q bo'lsa, avval
-- SUPABASE_SUPER_ADMIN_MIGRATION.sql ni to'liq ishlating.

-- clinic_admins (klinika admini login / parol)
CREATE TABLE IF NOT EXISTS public.clinic_admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, login)
);

CREATE INDEX IF NOT EXISTS idx_clinic_admins_clinic_id ON public.clinic_admins(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_admins_login ON public.clinic_admins(login);

-- REST API orqali murojaat qilish uchun jadval public schema da
-- va PostgREST avtomatik ko'radi. Qo'shimcha sozlash kerak bo'lmasa,
-- migration shu yerda tugaydi.
