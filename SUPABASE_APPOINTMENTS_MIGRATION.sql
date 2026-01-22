-- Appointments enhancements for visits table
-- Uchrashuvlar uchun qo'shimcha ustunlar va tarix

-- 1. Visits jadvaliga vaqt va resurs ustunlari
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS room VARCHAR(50),
  ADD COLUMN IF NOT EXISTS channel VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- 2. Reschedule/Change history jadvali
CREATE TABLE IF NOT EXISTS visit_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_history_visit_id ON visit_history(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_history_changed_at ON visit_history(changed_at DESC);

-- 3. Visit o'zgarganda tarixga yozish
CREATE OR REPLACE FUNCTION log_visit_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.date IS DISTINCT FROM OLD.date THEN
      changes := changes || jsonb_build_object('date', jsonb_build_object('old', OLD.date, 'new', NEW.date));
    END IF;
    IF NEW.start_time IS DISTINCT FROM OLD.start_time THEN
      changes := changes || jsonb_build_object('start_time', jsonb_build_object('old', OLD.start_time, 'new', NEW.start_time));
    END IF;
    IF NEW.end_time IS DISTINCT FROM OLD.end_time THEN
      changes := changes || jsonb_build_object('end_time', jsonb_build_object('old', OLD.end_time, 'new', NEW.end_time));
    END IF;
    IF NEW.doctor_id IS DISTINCT FROM OLD.doctor_id THEN
      changes := changes || jsonb_build_object('doctor_id', jsonb_build_object('old', OLD.doctor_id, 'new', NEW.doctor_id));
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      changes := changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    IF NEW.room IS DISTINCT FROM OLD.room THEN
      changes := changes || jsonb_build_object('room', jsonb_build_object('old', OLD.room, 'new', NEW.room));
    END IF;
    IF NEW.channel IS DISTINCT FROM OLD.channel THEN
      changes := changes || jsonb_build_object('channel', jsonb_build_object('old', OLD.channel, 'new', NEW.channel));
    END IF;

    IF changes <> '{}'::jsonb THEN
      INSERT INTO visit_history (visit_id, action, old_data, new_data, changed_by)
      VALUES (
        NEW.id,
        'update',
        to_jsonb(OLD),
        to_jsonb(NEW),
        NEW.updated_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_visit_changes ON visits;
CREATE TRIGGER trigger_log_visit_changes
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION log_visit_changes();

-- 4. RLS - Public access (anon key bilan ishlash uchun)
ALTER TABLE visit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visit history"
  ON visit_history FOR SELECT
  USING (true);

CREATE POLICY "Public can insert visit history"
  ON visit_history FOR INSERT
  WITH CHECK (true);
