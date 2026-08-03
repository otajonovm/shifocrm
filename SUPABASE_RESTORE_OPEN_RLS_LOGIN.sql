-- ShifoCRM: oddiy (legacy) login uchun RLS ni yumshatish
-- SQL Editor da bir marta ishga tushiring.
-- Maqsad: clinic_owners / clinic_admins / employees / doctors / clinics
-- anon kalit bilan o'qilishi (eski client-side login).

BEGIN;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinic_owners',
    'clinic_admins',
    'employees',
    'employee_permissions',
    'doctors',
    'clinics',
    'patients',
    'visits',
    'payments',
    'appointments',
    'visit_services',
    'odontograms',
    'services',
    'inventory_items',
    'clinic_inventory',
    'inventory_logs',
    'inventory_consumptions',
    'expenses',
    'cash_shifts',
    'leads',
    'treatment_plans',
    'treatment_plan_stages',
    'treatment_plan_items',
    'activity_logs'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_anon_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t || '_anon_all',
      t
    );
  END LOOP;
END $$;

COMMIT;
