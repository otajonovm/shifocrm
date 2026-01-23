-- Inventory & Expenses Migration for Supabase

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  cost_price NUMERIC(12, 2) DEFAULT 0,
  current_stock NUMERIC(12, 2) DEFAULT 0,
  min_stock NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL, -- in | out
  quantity NUMERIC(12, 2) NOT NULL,
  note TEXT,
  visit_id INTEGER,
  doctor_id INTEGER,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER trigger_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_visit_id ON inventory_movements(visit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_doctor_id ON inventory_movements(doctor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_at ON expenses(paid_at DESC);

-- RLS (Public for MVP)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view inventory items"
  ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Public can insert inventory items"
  ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update inventory items"
  ON inventory_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete inventory items"
  ON inventory_items FOR DELETE USING (true);

CREATE POLICY "Public can view inventory movements"
  ON inventory_movements FOR SELECT USING (true);
CREATE POLICY "Public can insert inventory movements"
  ON inventory_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete inventory movements"
  ON inventory_movements FOR DELETE USING (true);

CREATE POLICY "Public can view expenses"
  ON expenses FOR SELECT USING (true);
CREATE POLICY "Public can insert expenses"
  ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete expenses"
  ON expenses FOR DELETE USING (true);

-- Backfill columns if table already existed
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS visit_id INTEGER;
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS doctor_id INTEGER;
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS created_by TEXT;
