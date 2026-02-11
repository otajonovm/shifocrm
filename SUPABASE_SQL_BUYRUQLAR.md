# Supabase’ga buyruq yuborish

## 1. SQL Editor’dan buyruq ishlatish

1. [Supabase Dashboard](https://supabase.com/dashboard) ga kiring.
2. Loyihangizni tanlang.
3. Chap menyudan **SQL Editor** ni oching.
4. **New query** tugmasini bosing.
5. Quyidagi SQL’lardan keraklisini yozing (yoki nusxalab yopishtiring).
6. **Run** (yoki Ctrl+Enter) bosing.

---

## 2. Qo‘shimcha to‘lovlar uchun (visit_id / patient_id null bo‘lishi)

Yakka doktor uchun “Qo‘shimcha to‘lov” (ijara, ombor, boshqa) ishlashi uchun `payments` jadvalida `visit_id` va `patient_id` ixtiyoriy (null) bo‘lishi kerak.

```sql
-- Foreign key'larni olib tashlash (agar mavjud bo'lsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_visit_id_fkey' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_visit_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_patient_id_fkey' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_patient_id_fkey;
  END IF;
END $$;

-- visit_id va patient_id ni ixtiyoriy qilish
ALTER TABLE payments 
  ALTER COLUMN visit_id DROP NOT NULL,
  ALTER COLUMN patient_id DROP NOT NULL;
```

---

## 3. Tekshirish (ustunlar nullable ekanini ko‘rish)

```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('visit_id', 'patient_id', 'doctor_id');
```

`is_nullable` ustunida **YES** ko‘rinsa to‘g‘ri.

---

## 4. payments jadvalidagi constraint’larni ko‘rish

```sql
SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass;
```

Bu orqali `payments_type_check`, `payments_amount_check` va boshqa constraint’lar ko‘rinadi.

---

## 5. (Ixtiyoriy) amount manfiy bo‘lishiga ruxsat berish

Agar kelajakda chegirma/ajustment’larni **manfiy amount** bilan saqlashni xohlasangiz (hozirgi loyihada chegirma refund sifatida musbat saqlanadi, shart emas):

```sql
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_check;
ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK (true);
-- yoki faqat noldan boshqa: CHECK (amount != 0)
```

---

## 6. Supabase CLI orqali (lokal)

Agar Supabase CLI o‘rnatilgan bo‘lsa:

```bash
# Loyiha ildizida
npx supabase db execute --file supabase_migration.sql
```

Yoki SQL Editor’da `supabase_migration.sql` faylidagi barcha SQL’ni ochib, nusxalab Run qilishingiz mumkin.
