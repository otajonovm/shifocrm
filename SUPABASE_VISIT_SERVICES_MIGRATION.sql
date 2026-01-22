-- Visit services (performed treatments) migration
-- Bajarilgan ishlar ro'yxatini saqlash uchun

CREATE TABLE IF NOT EXISTS visit_services (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  tooth_id INTEGER,
  service_name VARCHAR(255) NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  performed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_services_visit_id ON visit_services(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_services_patient_id ON visit_services(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_services_doctor_id ON visit_services(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visit_services_created_at ON visit_services(created_at DESC);

ALTER TABLE visit_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visit services"
  ON visit_services FOR SELECT
  USING (true);

CREATE POLICY "Public can insert visit services"
  ON visit_services FOR INSERT
  WITH CHECK (true);
