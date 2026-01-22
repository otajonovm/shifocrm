-- Treatment plans migration
-- Davolash rejalarini saqlash uchun

CREATE TABLE IF NOT EXISTS treatment_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  planned_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  priority VARCHAR(10) DEFAULT 'medium',
  tooth_id INTEGER,
  estimated_cost NUMERIC(12, 2),
  notes TEXT,
  remind_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_status_check
  CHECK (status IN ('planned', 'done', 'cancelled', 'postponed'));

ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_doctor_id ON treatment_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_planned_date ON treatment_plans(planned_date DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_treatment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_treatment_plans_updated_at ON treatment_plans;
CREATE TRIGGER trigger_update_treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_plans_updated_at();

-- RLS (Public Access)
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view treatment plans"
  ON treatment_plans FOR SELECT
  USING (true);

CREATE POLICY "Public can insert treatment plans"
  ON treatment_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update treatment plans"
  ON treatment_plans FOR UPDATE
  USING (true)
  WITH CHECK (true);

