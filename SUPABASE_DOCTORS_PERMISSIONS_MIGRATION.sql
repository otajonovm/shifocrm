-- Doktor modul va ma'lumot ruxsatlari (boshliq tomonidan boshqariladi)
-- doctors.module_permissions — menyu modullari (JSONB)
-- doctors.data_permissions  — moliyaviy huquqlar (JSONB)

ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS module_permissions JSONB DEFAULT NULL;

ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS data_permissions JSONB DEFAULT NULL;

COMMENT ON COLUMN public.doctors.module_permissions IS
  'Modul ruxsatlari: can_view_patients, can_view_appointments, ...';

COMMENT ON COLUMN public.doctors.data_permissions IS
  'Ma''lumot ruxsatlari: can_view_revenue, can_export_data, can_edit_prices';
