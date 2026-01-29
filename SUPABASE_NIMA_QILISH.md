# Hozir nima qilish — Supabase SQL Editor tartibi

Supabase Dashboard → **SQL Editor** oching. Quyidagi fayllarni **shu tartibda** bitta-bitta ochib, mazmunini SQL Editor ga yopishtiring va **Run** bosing.

---

## Agar baza hali bo‘sh bo‘lsa (patients / doctors yo‘q)

Avval **0-qadam**ni ishlating (patients va doctors jadvallarini yaratadi).  
Agar bu jadvallar allaqachon mavjud bo‘lsa, 0-qadamni **o‘tkazing**.

| Qadam | Qaysi faylni tashlash | Qisqacha |
|-------|------------------------|----------|
| **0** | **SUPABASE_PATIENTS_DOCTORS.sql** | `patients` va `doctors` jadvallari (agar yo‘q bo‘lsa) |
| 1 | SUPABASE_SUPER_ADMIN_MIGRATION.sql | Klinikalar, clinic_admins, doctors ga clinic_id |
| 2 | SUPABASE_VISITS_MIGRATION_SIMPLE.sql | Visits jadvali |
| 3 | SUPABASE_INCOME_MIGRATION.sql | Payments jadvali |
| 4 | SUPABASE_TENANT_ISOLATION.sql | patients, visits, payments ga clinic_id |
| 5 | SUPABASE_APPOINTMENTS_MIGRATION.sql | Visits ga vaqt/xona, visit_history |
| 6 | SUPABASE_DOCTORS_PROFILE_MIGRATION.sql | doctors ga work_schedule |
| 7 | SUPABASE_INVENTORY_MIGRATION.sql | inventory_items, movements, expenses |
| 8 | SUPABASE_INVENTORY_CONSUMPTIONS.sql | inventory_consumptions |
| 9 | SUPABASE_VISIT_SERVICES_MIGRATION.sql | visit_services |
| 10 | SUPABASE_TENANT_ISOLATION_OMBOR_XIZMATLAR.sql | Ombor/xizmatlar ga clinic_id |
| 11 | SUPABASE_ODONTOGRAM_MIGRATION.sql | odontograms |
| 12 | SUPABASE_TREATMENT_PLANS_MIGRATION.sql | treatment_plans |
| 13 | SUPABASE_SERVICE_PRICE_AUDIT.sql | service_price_audit, narx triggeri |

---

## Qisqa yo‘riqnoma

1. **Supabase** → **SQL Editor** oching.
2. Loyihadan **1-qadam** faylini oching (yoki 0-qadam, agar patients/doctors yo‘q bo‘lsa).
3. Barcha matnni **Copy** qiling, SQL Editor ga **Paste** qiling, **Run** bosing.
4. "Success" yoki "No rows returned" chiqsa — keyingi qadamga o‘ting.
5. Xato chiqsa — xabar matnini ko‘chirib saqlang va keyingi qadamga o‘tishdan oldin tuzating.
6. 2–5 ni **13-qadamgacha** takrorlang.

---

## Qo‘shimcha

- **SUPABASE_CLINIC_ADMINS_ONLY.sql** — tashlamang (SUPER_ADMIN_MIGRATION da clinic_admins bor).
- **SUPABASE_VISITS_MIGRATION.sql** — 2-qadamda **SIMPLE** ni ishlatgan bo‘lsangiz, oddiy VISITS_MIGRATION ni **ishlatmang** (bittasi yetadi).
- **services**, **service_packages**, **discount_rules** — agar ilovada ishlatilsa va jadvallar yo‘q bo‘lsa, ularni Supabase Table Editor orqali yoki alohida skript bilan yaratishingiz kerak (TENANT_ISOLATION_OMBOR_XIZMATLAR faqat mavjud jadvallarga clinic_id qo‘shadi).
