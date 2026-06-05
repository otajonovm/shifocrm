-- Treatment plans migration
-- Davolash rejalarini saqlash uchun

CREATE TABLE IF NOT EXISTS treatment_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  planned_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'offered',
  priority VARCHAR(10) DEFAULT 'medium',
  tooth_id INTEGER,
  estimated_cost NUMERIC(12, 2),
  notes TEXT,
  remind_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Old status mapping -> new enum values
UPDATE treatment_plans
SET status = 'scheduled'
WHERE status IN ('planned', 'postponed');

UPDATE treatment_plans
SET status = 'done'
WHERE status = 'done';

UPDATE treatment_plans
SET status = 'cancelled'
WHERE status = 'cancelled';

ALTER TABLE treatment_plans
  DROP CONSTRAINT IF EXISTS treatment_plans_status_check;

ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_status_check
  CHECK (status IN ('offered', 'scheduled', 'in_progress', 'done', 'cancelled'));

ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_doctor_id ON treatment_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_planned_date ON treatment_plans(planned_date DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);

-- Multi-stage: stages
CREATE TABLE IF NOT EXISTS treatment_plan_stages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  planned_date DATE,
  sort_order INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_plan_stages_plan_id ON treatment_plan_stages(plan_id);

-- Multi-stage: items (services)
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stage_id BIGINT NOT NULL REFERENCES treatment_plan_stages(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  tooth_id INTEGER,
  estimated_cost NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_stage_id ON treatment_plan_items(stage_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_service_id ON treatment_plan_items(service_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_treatment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_treatment_plan_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_treatment_plan_items_updated_at()
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

DROP TRIGGER IF EXISTS trigger_update_treatment_plan_stages_updated_at ON treatment_plan_stages;
CREATE TRIGGER trigger_update_treatment_plan_stages_updated_at
  BEFORE UPDATE ON treatment_plan_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_plan_stages_updated_at();

DROP TRIGGER IF EXISTS trigger_update_treatment_plan_items_updated_at ON treatment_plan_items;
CREATE TRIGGER trigger_update_treatment_plan_items_updated_at
  BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_plan_items_updated_at();

-- RLS (Public Access)
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE treatment_plan_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Public can view treatment plan stages"
  ON treatment_plan_stages FOR SELECT
  USING (true);

CREATE POLICY "Public can insert treatment plan stages"
  ON treatment_plan_stages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update treatment plan stages"
  ON treatment_plan_stages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete treatment plan stages"
  ON treatment_plan_stages FOR DELETE
  USING (true);

CREATE POLICY "Public can view treatment plan items"
  ON treatment_plan_items FOR SELECT
  USING (true);

CREATE POLICY "Public can insert treatment plan items"
  ON treatment_plan_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update treatment plan items"
  ON treatment_plan_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete treatment plan items"
  ON treatment_plan_items FOR DELETE
  USING (true);

