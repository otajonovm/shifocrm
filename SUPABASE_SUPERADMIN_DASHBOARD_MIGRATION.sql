-- Superadmin Dashboard analytics objects
-- Session audit, expense tracking, and revenue summary views

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout')),
  user_role TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can delete audit logs" ON public.audit_logs;

CREATE POLICY "Public can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (true);

CREATE POLICY "Public can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update audit logs"
  ON public.audit_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete audit logs"
  ON public.audit_logs FOR DELETE
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.clinic_expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id INTEGER REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES public.doctors(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'other',
  note TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_expenses_clinic_spent_at
  ON public.clinic_expenses(clinic_id, spent_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_expenses_doctor_spent_at
  ON public.clinic_expenses(doctor_id, spent_at DESC);

ALTER TABLE public.clinic_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view clinic expenses" ON public.clinic_expenses;
DROP POLICY IF EXISTS "Public can insert clinic expenses" ON public.clinic_expenses;
DROP POLICY IF EXISTS "Public can update clinic expenses" ON public.clinic_expenses;
DROP POLICY IF EXISTS "Public can delete clinic expenses" ON public.clinic_expenses;

CREATE POLICY "Public can view clinic expenses"
  ON public.clinic_expenses FOR SELECT
  USING (true);

CREATE POLICY "Public can insert clinic expenses"
  ON public.clinic_expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update clinic expenses"
  ON public.clinic_expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete clinic expenses"
  ON public.clinic_expenses FOR DELETE
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_expenses TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.v_superadmin_transactions AS
SELECT
  p.id,
  p.clinic_id,
  p.doctor_id,
  CASE
    WHEN c.slug LIKE 'solo-%' THEN 'solo_doctor'
    ELSE 'clinic'
  END AS entity_type,
  CASE
    WHEN c.slug LIKE 'solo-%' THEN COALESCE(d.full_name, c.name, 'Solo Doctor')
    ELSE COALESCE(c.name, 'Clinic')
  END AS entity_name,
  p.amount,
  p.payment_type,
  p.method,
  p.note,
  p.paid_at,
  CASE
    WHEN p.payment_type = 'refund' THEN 'refunded'
    WHEN p.payment_type = 'adjustment' THEN 'adjusted'
    ELSE 'paid'
  END AS tx_status
FROM public.payments p
LEFT JOIN public.clinics c ON c.id = p.clinic_id
LEFT JOIN public.doctors d ON d.id = p.doctor_id;

CREATE OR REPLACE VIEW public.v_superadmin_revenue_summary AS
WITH transaction_rollup AS (
  SELECT
    p.clinic_id,
    CASE
      WHEN c.slug LIKE 'solo-%' THEN 'solo_doctor'
      ELSE 'clinic'
    END AS entity_type,
    CASE
      WHEN c.slug LIKE 'solo-%' THEN COALESCE(MAX(d.full_name), c.name, 'Solo Doctor')
      ELSE COALESCE(c.name, 'Clinic')
    END AS entity_name,
    COALESCE(SUM(CASE WHEN p.payment_type = 'payment' THEN p.amount ELSE 0 END), 0) AS total_paid,
    COALESCE(SUM(CASE WHEN p.payment_type = 'refund' THEN p.amount ELSE 0 END), 0) AS total_refunded,
    COALESCE(SUM(CASE WHEN p.payment_type = 'adjustment' THEN ABS(p.amount) ELSE 0 END), 0) AS total_adjusted,
    COALESCE(SUM(
      CASE
        WHEN p.payment_type = 'refund' THEN -p.amount
        ELSE p.amount
      END
    ), 0) AS net_revenue,
    MAX(p.paid_at) AS last_payment_at
  FROM public.payments p
  LEFT JOIN public.clinics c ON c.id = p.clinic_id
  LEFT JOIN public.doctors d ON d.id = p.doctor_id
  GROUP BY p.clinic_id, c.slug, c.name
),
base_entities AS (
  SELECT
    c.id AS clinic_id,
    CASE
      WHEN c.slug LIKE 'solo-%' THEN 'solo_doctor'
      ELSE 'clinic'
    END AS entity_type,
    CASE
      WHEN c.slug LIKE 'solo-%' THEN COALESCE(d.full_name, c.name, 'Solo Doctor')
      ELSE COALESCE(c.name, 'Clinic')
    END AS entity_name
  FROM public.clinics c
  LEFT JOIN LATERAL (
    SELECT full_name
    FROM public.doctors d
    WHERE d.clinic_id = c.id
    ORDER BY d.id ASC
    LIMIT 1
  ) d ON TRUE
)
SELECT
  b.clinic_id,
  b.entity_type,
  b.entity_name,
  COALESCE(r.total_paid, 0) AS total_paid,
  COALESCE(r.total_refunded, 0) AS total_refunded,
  COALESCE(r.total_adjusted, 0) AS total_adjusted,
  COALESCE(r.net_revenue, 0) AS net_revenue,
  r.last_payment_at,
  CASE
    WHEN r.last_payment_at IS NULL THEN 'inactive'
    WHEN r.last_payment_at >= NOW() - INTERVAL '30 days' THEN 'active'
    WHEN r.last_payment_at >= NOW() - INTERVAL '90 days' THEN 'attention'
    ELSE 'inactive'
  END AS payment_status
FROM base_entities b
LEFT JOIN transaction_rollup r ON r.clinic_id = b.clinic_id;

GRANT SELECT ON public.v_superadmin_transactions TO anon, authenticated, service_role;
GRANT SELECT ON public.v_superadmin_revenue_summary TO anon, authenticated, service_role;
