-- Inventory consumptions: materials used by doctors

CREATE TABLE IF NOT EXISTS inventory_consumptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  item_id BIGINT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: on consumption insert -> movement out + update stock
CREATE OR REPLACE FUNCTION handle_inventory_consumption()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory_movements (item_id, type, quantity, note, visit_id, doctor_id, created_by, created_at)
  VALUES (
    NEW.item_id,
    'out',
    NEW.quantity,
    COALESCE(NEW.note, 'Consumption'),
    NEW.visit_id,
    NEW.doctor_id,
    COALESCE(NEW.doctor_id::TEXT, NULL),
    NOW()
  );

  UPDATE inventory_items
  SET current_stock = COALESCE(current_stock, 0) - NEW.quantity
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inventory_consumption ON inventory_consumptions;
CREATE TRIGGER trigger_inventory_consumption
  AFTER INSERT ON inventory_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_inventory_consumption();

CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_visit_id ON inventory_consumptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_item_id ON inventory_consumptions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_created_at ON inventory_consumptions(created_at DESC);

ALTER TABLE inventory_consumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view inventory consumptions"
  ON inventory_consumptions FOR SELECT USING (true);
CREATE POLICY "Public can insert inventory consumptions"
  ON inventory_consumptions FOR INSERT WITH CHECK (true);
