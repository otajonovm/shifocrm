-- Bot cashback-v1 table name aliases. See SUPABASE_CASHBACK_BOT_COMPAT.sql

CREATE OR REPLACE VIEW public.cashback_balances
WITH (security_invoker = true) AS
SELECT
  patient_id,
  balance,
  lifetime_earned,
  lifetime_spent,
  created_at,
  updated_at
FROM public.patient_cashback_balances;

CREATE OR REPLACE VIEW public.referrals
WITH (security_invoker = true) AS
SELECT *
FROM public.patient_referrals;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cashback_balances TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
