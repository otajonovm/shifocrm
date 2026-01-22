# Visits Supabase Migration Guide
# Visits Supabase'ga Ko'chirish Qo'llanmasi

## 📋 Qadamlar

### 1. Supabase Database'da Jadval Yaratish

Supabase Dashboard → SQL Editor ga kiring va `SUPABASE_VISITS_MIGRATION.sql` faylidagi SQL kodlarni ishga tushiring.

**Yoki quyidagi SQL kodlarni to'g'ridan-to'g'ri ishga tushiring:**

```sql
-- Visits jadvalini yaratish
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  price NUMERIC(12, 2) DEFAULT NULL,
  paid_amount NUMERIC(12, 2) DEFAULT NULL,
  debt_amount NUMERIC(12, 2) DEFAULT NULL,
  service_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_visits_updated_at();

-- Debt_amount avtomatik hisoblash trigger
CREATE OR REPLACE FUNCTION calculate_visit_debt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
    NEW.debt_amount = GREATEST(0, NEW.price - COALESCE(NEW.paid_amount, 0));
    
    IF NEW.debt_amount = 0 AND NEW.status = 'completed_debt' THEN
      NEW.status = 'completed_paid';
      NEW.debt_amount = NULL;
    END IF;
    
    IF NEW.debt_amount > 0 AND NEW.status = 'completed_paid' THEN
      NEW.status = 'completed_debt';
    END IF;
  ELSE
    NEW.debt_amount = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_visit_debt
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_visit_debt();

-- RLS Policies
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Admin barcha visitlarni ko'ra oladi
CREATE POLICY "Admin can view all visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Doctor o'z visitlarini ko'ra oladi
CREATE POLICY "Doctors can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = visits.patient_id
      AND patients.doctor_id = auth.uid()
    )
  );

-- Admin barcha visitlarni boshqara oladi
CREATE POLICY "Admin can manage all visits"
  ON visits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Doctor o'z visitlarini boshqara oladi
CREATE POLICY "Doctors can manage own visits"
  ON visits FOR ALL
  TO authenticated
  USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = visits.patient_id
      AND patients.doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = visits.patient_id
      AND patients.doctor_id = auth.uid()
    )
  );

-- ID generatsiya funksiyasi
CREATE OR REPLACE FUNCTION generate_visit_id()
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
  exists_check INTEGER;
BEGIN
  LOOP
    new_id := 10000 + FLOOR(RANDOM() * 90000)::INTEGER;
    SELECT COUNT(*) INTO exists_check FROM visits WHERE id = new_id;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Default ID trigger
CREATE OR REPLACE FUNCTION set_visit_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := generate_visit_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_visit_id
  BEFORE INSERT ON visits
  FOR EACH ROW
  WHEN (NEW.id IS NULL)
  EXECUTE FUNCTION set_visit_id();
```

### 2. localStorage'dan Ma'lumotlarni Ko'chirish (Ixtiyoriy)

Agar localStorage'da mavjud visit ma'lumotlari bo'lsa, ularni Supabase'ga ko'chirish uchun quyidagi skriptni ishlatishingiz mumkin:

**Browser Console'da ishga tushiring:**

```javascript
// localStorage'dan visitlarni olish
const visits = JSON.parse(localStorage.getItem('shifocrm_visits') || '[]')

// Har bir visitni Supabase'ga yuborish
for (const visit of visits) {
  try {
    const response = await fetch('YOUR_SUPABASE_URL/rest/v1/visits', {
      method: 'POST',
      headers: {
        'apikey': 'YOUR_SUPABASE_ANON_KEY',
        'Authorization': `Bearer YOUR_SUPABASE_ANON_KEY`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: visit.id,
        patient_id: visit.patient_id,
        doctor_id: visit.doctor_id,
        doctor_name: visit.doctor_name,
        date: visit.date,
        status: visit.status,
        notes: visit.notes,
        price: visit.price,
        paid_amount: visit.paid_amount,
        debt_amount: visit.debt_amount,
        service_name: visit.service_name
      })
    })
    
    if (response.ok) {
      console.log('✅ Visit migrated:', visit.id)
    } else {
      console.error('❌ Failed to migrate visit:', visit.id, await response.text())
    }
  } catch (error) {
    console.error('❌ Error migrating visit:', visit.id, error)
  }
}

console.log('Migration completed!')
```

### 3. Kod Yangilanishi

`src/api/visitsApi.js` fayli allaqachon Supabase'ga moslashtirilgan. Faqat loyihani qayta ishga tushirish kerak:

```bash
npm run dev
```

### 4. Test Qilish

1. Yangi bemor yaratish - avtomatik birinchi visit yaratilishi kerak
2. Visit status o'zgartirish
3. Qarz hisob kitobi
4. Visit o'chirish

## ⚠️ Muhim Eslatmalar

1. **RLS Policies:** Agar authentication ishlatilmasa, RLS policies'ni o'chirish yoki public access qilish kerak bo'lishi mumkin.

2. **ID Generatsiya:** Supabase trigger orqali avtomatik ID generatsiya qiladi, lekin agar muammo bo'lsa, frontend'dan ham ID yuborish mumkin.

3. **Debt Calculation:** Database trigger orqali avtomatik hisoblanadi, lekin frontend'dan ham yuborilishi mumkin.

4. **Backup:** Migration dan oldin localStorage ma'lumotlarini backup qiling!

## 🔍 Troubleshooting

### "Permission denied" xatosi
- RLS policies'ni tekshiring
- Authentication sozlamalarini tekshiring

### "ID already exists" xatosi
- ID generatsiya funksiyasini tekshiring
- Mavjud ID'larni tekshiring

### "Foreign key violation" xatosi
- Patient yoki Doctor ID'larni tekshiring
- References to'g'ri sozlanganligini tekshiring

---

**Oxirgi Yangilanish:** 2024  
**Status:** Ready for Migration
