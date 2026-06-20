-- Kassa smenalari (Faza A)
CREATE TABLE IF NOT EXISTS cash_shifts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  opened_by TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(14, 2),
  expected_balance NUMERIC(14, 2),
  cash_total NUMERIC(14, 2) DEFAULT 0,
  card_total NUMERIC(14, 2) DEFAULT 0,
  transfer_total NUMERIC(14, 2) DEFAULT 0,
  other_total NUMERIC(14, 2) DEFAULT 0,
  refund_total NUMERIC(14, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_shifts_clinic_status ON cash_shifts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_opened_at ON cash_shifts(opened_at DESC);

ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view cash shifts"
  ON cash_shifts FOR SELECT USING (true);

CREATE POLICY "Public can insert cash shifts"
  ON cash_shifts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update cash shifts"
  ON cash_shifts FOR UPDATE USING (true) WITH CHECK (true);

-- Davolash rejasi eslatmalari holati
ALTER TABLE treatment_plans
  ADD COLUMN IF NOT EXISTS remind_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE treatment_plans
  ADD COLUMN IF NOT EXISTS remind_sent_at TIMESTAMPTZ;

ALTER TABLE treatment_plans
  DROP CONSTRAINT IF EXISTS treatment_plans_remind_status_check;

ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_remind_status_check
  CHECK (remind_status IN ('pending', 'sent', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_treatment_plans_remind_due
  ON treatment_plans(remind_at)
  WHERE remind_status = 'pending' AND remind_at IS NOT NULL;
