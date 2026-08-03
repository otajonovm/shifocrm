BEGIN;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS cash_shift_id BIGINT,
  ADD COLUMN IF NOT EXISTS cash_register_id BIGINT;

INSERT INTO public.expenses (clinic_id, category, amount, paid_at, note)
SELECT
  p.clinic_id,
  COALESCE((regexp_match(COALESCE(p.note, ''), '\[CATEGORY:([^\]]+)\]'))[1], 'other'),
  ABS(p.amount),
  p.paid_at,
  p.note
FROM public.payments p
WHERE p.payment_type = 'adjustment'
  AND p.amount < 0
  AND NOT EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.clinic_id = p.clinic_id
      AND e.note = p.note
      AND e.paid_at = p.paid_at
      AND e.amount = ABS(p.amount)
  );

-- Avval eski CHECK ni ochamiz (discount hali ruxsat etilmagan bo'lishi mumkin)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_check;

UPDATE public.payments
SET payment_type = 'discount'
WHERE payment_type IN ('refund', 'adjustment')
  AND COALESCE(note, '') ILIKE '%[DISCOUNT]%';

UPDATE public.payments
SET payment_type = 'refund'
WHERE payment_type IN ('return', 'returned');

UPDATE public.payments
SET payment_type = 'payment'
WHERE payment_type = 'adjustment' AND amount >= 0;

DELETE FROM public.payments WHERE payment_type = 'adjustment';

UPDATE public.payments
SET payment_type = 'payment'
WHERE payment_type IS NULL
   OR BTRIM(payment_type) = ''
   OR payment_type NOT IN ('payment', 'refund', 'discount');

UPDATE public.payments
SET amount = ABS(amount)
WHERE amount < 0
  AND payment_type IN ('payment', 'refund', 'discount');

ALTER TABLE public.payments
  ADD CONSTRAINT payments_type_check
    CHECK (payment_type IN ('payment', 'refund', 'discount'));

ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_check CHECK (amount > 0);

DO $$
BEGIN
  IF to_regclass('public.cash_shifts') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'payments_cash_shift_id_fkey'
     ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_cash_shift_id_fkey
      FOREIGN KEY (cash_shift_id) REFERENCES public.cash_shifts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_clinic_idempotency
  ON public.payments(clinic_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_clinic_visit
  ON public.payments(clinic_id, visit_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_clinic_doctor_paid
  ON public.payments(clinic_id, doctor_id, paid_at);

DROP TRIGGER IF EXISTS trigger_calculate_visit_debt ON public.visits;

CREATE OR REPLACE FUNCTION public.calculate_visit_financials()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_discount NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(p.amount), 0)
    INTO v_discount
  FROM public.payments p
  WHERE p.visit_id = NEW.id
    AND p.clinic_id = NEW.clinic_id
    AND p.payment_type = 'discount';

  NEW.paid_amount := GREATEST(COALESCE(NEW.paid_amount, 0), 0);
  NEW.debt_amount := GREATEST(
    COALESCE(NEW.price, 0) - v_discount - NEW.paid_amount,
    0
  );

  IF NEW.status IN ('completed_paid', 'completed_debt') THEN
    NEW.status := CASE WHEN NEW.debt_amount > 0
      THEN 'completed_debt' ELSE 'completed_paid' END;
  END IF;
  IF NEW.debt_amount = 0 THEN NEW.debt_amount := NULL; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_visit_financials
  BEFORE INSERT OR UPDATE OF price, paid_amount ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.calculate_visit_financials();

CREATE OR REPLACE FUNCTION public.recalc_visit_paid_amount(p_visit_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_paid NUMERIC;
BEGIN
  SELECT COALESCE(SUM(CASE
    WHEN payment_type = 'payment' THEN amount
    WHEN payment_type = 'refund' THEN -amount
    ELSE 0
  END), 0)
  INTO v_paid
  FROM public.payments
  WHERE visit_id = p_visit_id;

  UPDATE public.visits
  SET paid_amount = GREATEST(v_paid, 0)
  WHERE id = p_visit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalc_visit_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.visit_id IS NOT NULL THEN
      PERFORM public.recalc_visit_paid_amount(OLD.visit_id);
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.visit_id IS DISTINCT FROM NEW.visit_id
     AND OLD.visit_id IS NOT NULL THEN
    PERFORM public.recalc_visit_paid_amount(OLD.visit_id);
  END IF;
  IF NEW.visit_id IS NOT NULL THEN
    PERFORM public.recalc_visit_paid_amount(NEW.visit_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalc_visit_paid_amount ON public.payments;
CREATE TRIGGER trigger_recalc_visit_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_visit_paid_amount();

CREATE OR REPLACE FUNCTION public.post_visit_payment(
  p_visit_id INTEGER,
  p_amount NUMERIC,
  p_type TEXT,
  p_method TEXT,
  p_idempotency_key UUID,
  p_cash_shift_id BIGINT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_visit public.visits;
  v_payment public.payments;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF NOT (
    public.is_clinic_owner_role()
    OR public.current_employee_has('finance', 'post_payment')
  ) THEN
    RAISE EXCEPTION 'payment_permission_denied' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023';
  END IF;
  IF p_type NOT IN ('payment', 'refund', 'discount') THEN
    RAISE EXCEPTION 'invalid_payment_type' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO STRICT v_visit
  FROM public.visits
  WHERE id = p_visit_id
    AND clinic_id = public.current_clinic_id()
  FOR UPDATE;

  INSERT INTO public.payments(
    visit_id, patient_id, doctor_id, clinic_id, amount,
    payment_type, method, note, paid_at, idempotency_key,
    cash_shift_id, cash_register_id
  )
  VALUES (
    v_visit.id, v_visit.patient_id, v_visit.doctor_id, v_visit.clinic_id,
    p_amount, p_type, NULLIF(p_method, ''), NULLIF(p_note, ''), NOW(),
    p_idempotency_key, p_cash_shift_id,
    (SELECT cash_register_id FROM public.cash_shifts WHERE id = p_cash_shift_id)
  )
  ON CONFLICT (clinic_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL
  DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.post_visit_payment(
  INTEGER, NUMERIC, TEXT, TEXT, UUID, BIGINT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_visit_payment(
  INTEGER, NUMERIC, TEXT, TEXT, UUID, BIGINT, TEXT
) TO authenticated;

ALTER TABLE public.cash_shifts
  ADD COLUMN IF NOT EXISTS cash_register_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_shift_open_register
  ON public.cash_shifts(clinic_id, COALESCE(cash_register_id, 0))
  WHERE status = 'open';

CREATE OR REPLACE FUNCTION public.open_cash_shift(
  p_cash_register_id BIGINT,
  p_opening_balance NUMERIC DEFAULT 0
)
RETURNS public.cash_shifts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE v_shift public.cash_shifts;
BEGIN
  IF NOT public.current_employee_has('finance', 'open_shift') THEN
    RAISE EXCEPTION 'shift_permission_denied' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.cash_shifts(
    clinic_id, cash_register_id, opening_balance, opened_by, status
  ) VALUES (
    public.current_clinic_id(), p_cash_register_id,
    GREATEST(COALESCE(p_opening_balance, 0), 0),
    COALESCE(public.current_employee_id()::text, public.current_app_role()),
    'open'
  )
  RETURNING * INTO v_shift;
  RETURN v_shift;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_cash_shift(
  p_shift_id BIGINT,
  p_closing_cash NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.cash_shifts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_shift public.cash_shifts;
  v_cash_in NUMERIC;
  v_cash_refund NUMERIC;
BEGIN
  IF NOT public.current_employee_has('finance', 'close_shift') THEN
    RAISE EXCEPTION 'shift_permission_denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO STRICT v_shift
  FROM public.cash_shifts
  WHERE id = p_shift_id
    AND clinic_id = public.current_clinic_id()
    AND status = 'open'
  FOR UPDATE;

  SELECT
    COALESCE(SUM(amount) FILTER (
      WHERE payment_type = 'payment' AND method = 'cash'
    ), 0),
    COALESCE(SUM(amount) FILTER (
      WHERE payment_type = 'refund' AND method = 'cash'
    ), 0)
  INTO v_cash_in, v_cash_refund
  FROM public.payments
  WHERE cash_shift_id = v_shift.id;

  UPDATE public.cash_shifts
  SET status = 'closed',
      closed_at = NOW(),
      cash_total = v_cash_in,
      refund_total = v_cash_refund,
      expected_balance = opening_balance + v_cash_in - v_cash_refund,
      closing_balance = p_closing_cash,
      notes = p_notes,
      updated_at = NOW()
  WHERE id = v_shift.id
  RETURNING * INTO v_shift;
  RETURN v_shift;
END;
$$;

REVOKE ALL ON FUNCTION public.open_cash_shift(BIGINT, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.close_cash_shift(BIGINT, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_cash_shift(BIGINT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cash_shift(BIGINT, NUMERIC, TEXT) TO authenticated;

CREATE OR REPLACE VIEW public.visit_financial_summary
WITH (security_invoker = true)
AS
SELECT
  v.clinic_id,
  v.id AS visit_id,
  v.patient_id,
  v.doctor_id,
  COALESCE(v.price, 0) AS service_charge,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'payment'), 0)
    - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'refund'), 0) AS net_paid,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'discount'), 0) AS discount,
  GREATEST(
    COALESCE(v.price, 0)
    - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'discount'), 0)
    - (
      COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'payment'), 0)
      - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'refund'), 0)
    ),
    0
  ) AS debt
FROM public.visits v
LEFT JOIN public.payments p ON p.visit_id = v.id AND p.clinic_id = v.clinic_id
GROUP BY v.clinic_id, v.id, v.patient_id, v.doctor_id, v.price;

COMMIT;
