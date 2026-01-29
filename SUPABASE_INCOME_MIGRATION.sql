-- Income/Payments Migration for Supabase
-- Daromadni aniq hisoblash uchun payments (tushum) jadvali

-- 1. Payments jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visit_id INTEGER NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES public.doctors(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_type VARCHAR(20) NOT NULL DEFAULT 'payment',
  method VARCHAR(50),
  note TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Check constraint (faqat ruxsat etilgan turlar)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_type_check
  CHECK (payment_type IN ('payment', 'refund', 'adjustment'));

-- 3. Indexlar
CREATE INDEX IF NOT EXISTS idx_payments_visit_id ON public.payments(visit_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON public.payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at DESC);

-- 4. Updated_at avtomatik yangilanish trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE PROCEDURE update_payments_updated_at();

-- 5. Visits.paid_amount ni payments bo'yicha qayta hisoblash
CREATE OR REPLACE FUNCTION recalc_visit_paid_amount(p_visit_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.visits v
  SET paid_amount = (
    SELECT COALESCE(SUM(
      CASE
        WHEN p.payment_type = 'refund' THEN -p.amount
        ELSE p.amount
      END
    ), 0)
    FROM public.payments p
    WHERE p.visit_id = p_visit_id
  )
  WHERE v.id = p_visit_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_recalc_visit_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM recalc_visit_paid_amount(OLD.visit_id);
    RETURN OLD;
  END IF;

  -- UPDATE holatida visit_id o'zgarsa, eski va yangi visitni hisobla
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.visit_id IS DISTINCT FROM NEW.visit_id) THEN
      PERFORM recalc_visit_paid_amount(OLD.visit_id);
    END IF;
  END IF;

  PERFORM recalc_visit_paid_amount(NEW.visit_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalc_visit_paid_amount ON public.payments;
CREATE TRIGGER trigger_recalc_visit_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_recalc_visit_paid_amount();

-- 6. Row Level Security (RLS) - Public Access
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Public can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Public can update payments" ON public.payments;
DROP POLICY IF EXISTS "Public can delete payments" ON public.payments;

CREATE POLICY "Public can view all payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Public can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update payments"
  ON public.payments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete payments"
  ON public.payments FOR DELETE
  USING (true);

-- 7. Daromad viewlari (kunlik va oylik)
CREATE OR REPLACE VIEW income_daily AS
SELECT
  DATE(paid_at) AS day,
  COALESCE(SUM(CASE WHEN payment_type = 'payment' THEN amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN payment_type = 'refund' THEN amount ELSE 0 END), 0) AS total_refunds,
  COALESCE(SUM(CASE WHEN payment_type = 'adjustment' THEN amount ELSE 0 END), 0) AS total_adjustments,
  COALESCE(SUM(
    CASE
      WHEN payment_type = 'refund' THEN -amount
      ELSE amount
    END
  ), 0) AS net_income
FROM public.payments
GROUP BY DATE(paid_at)
ORDER BY day DESC;

CREATE OR REPLACE VIEW income_monthly AS
SELECT
  DATE_TRUNC('month', paid_at)::DATE AS month,
  COALESCE(SUM(CASE WHEN payment_type = 'payment' THEN amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN payment_type = 'refund' THEN amount ELSE 0 END), 0) AS total_refunds,
  COALESCE(SUM(CASE WHEN payment_type = 'adjustment' THEN amount ELSE 0 END), 0) AS total_adjustments,
  COALESCE(SUM(
    CASE
      WHEN payment_type = 'refund' THEN -amount
      ELSE amount
    END
  ), 0) AS net_income
FROM public.payments
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

-- 8. Comments
COMMENT ON TABLE public.payments IS 'Bemor to''lovlari va daromad harakatlari';
COMMENT ON COLUMN public.payments.payment_type IS 'payment, refund, adjustment';
COMMENT ON COLUMN public.payments.amount IS 'Summasi (so''m)';
