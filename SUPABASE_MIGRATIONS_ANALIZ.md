# Supabase migratsiyalari — tahlil va SQL Editor tartibi

Bu hujjat loyihadagi barcha `SUPABASE_*.sql` fayllarida **nima qilinganini** va **Supabase SQL Editor da qanday tartibda tashlash kerakligini** qisqacha tushuntiradi.

---

## 1. Har bir fayl nima qiladi

| Fayl | Nima qilingan |
|------|----------------|
| **SUPABASE_SUPER_ADMIN_MIGRATION.sql** | `clinics` jadvali (klinikalar), `profiles` (rollar), `doctors` ga `clinic_id` qo‘shish, default klinika yaratish, `clinic_admins` (klinika admini login/parol). **Asosiy:** barcha ko‘p klinikali tizim shu fayldan boshlanadi. |
| **SUPABASE_CLINIC_ADMINS_ONLY.sql** | Faqat `clinic_admins` jadvali. **Eslatma:** Agar `SUPABASE_SUPER_ADMIN_MIGRATION.sql` ni to‘liq ishlatgan bo‘lsangiz, bu fayl **kerak emas** (clinic_admins allaqachon u yerda yaratilgan). |
| **SUPABASE_TENANT_ISOLATION.sql** | `patients`, `visits`, `payments` jadvallariga `clinic_id` qo‘shish va mavjud qatorlarni default klinikaga bog‘lash. **Shart:** `clinics` jadvali va `patients`, `visits`, `payments` jadvallari mavjud bo‘lishi kerak. |
| **SUPABASE_TENANT_ISOLATION_OMBOR_XIZMATLAR.sql** | Ombor va xizmatlar jadvallariga `clinic_id`: `inventory_items`, `inventory_movements`, `expenses`, `inventory_consumptions`, `visit_services`, `services`, `service_packages`, `service_package_items`, `discount_rules`. Daromad viewlari (`income_daily`, `income_monthly` va b.)ni `clinic_id` bo‘yicha qayta yaratadi. **Shart:** Avval `SUPABASE_TENANT_ISOLATION.sql` ishlatilgan bo‘lishi kerak. |
| **SUPABASE_VISITS_MIGRATION.sql** | `visits` jadvali yaratish (yoki mavjud bo‘lsa hech narsa), indexlar, `updated_at` / `debt_amount` triggerlari, RLS, `generate_visit_id` / `set_visit_id`. |
| **SUPABASE_VISITS_MIGRATION_SIMPLE.sql** | Xuddi shu `visits` jadvali + triggerlar + RLS + `generate_visit_id` / `set_visit_id`. **Farq:** SIMPLE versiyasi bir xil struktura, bitta faylda. **Bittasini tanlang:** yoki VISITS_MIGRATION yoki VISITS_MIGRATION_SIMPLE (ikkalasini ham ketma-ket ishlatish shart emas). |
| **SUPABASE_APPOINTMENTS_MIGRATION.sql** | `visits` ga qo‘shimcha ustunlar: `start_time`, `end_time`, `duration_minutes`, `room`, `channel`, `updated_by`. `visit_history` jadvali va vizit o‘zgarishlarini yozadigan trigger. **Shart:** `visits` jadvali mavjud bo‘lishi kerak. |
| **SUPABASE_INCOME_MIGRATION.sql** | `payments` jadvali yaratish (visit_id, patient_id, doctor_id, amount, payment_type, paid_at va h.k.), triggerlar (`updated_at`, `recalc_visit_paid_amount`), RLS, `income_daily` va `income_monthly` viewlari. **Eslatma:** Bu viewlar `clinic_id` siz; keyin TENANT_ISOLATION_OMBOR_XIZMATLAR ularni `clinic_id` bilan qayta yaratadi. |
| **SUPABASE_DOCTORS_PROFILE_MIGRATION.sql** | `doctors` jadvaliga `work_schedule` (jsonb) ustuni qo‘shish. **Shart:** `doctors` jadvali mavjud. |
| **SUPABASE_INVENTORY_MIGRATION.sql** | `inventory_items`, `inventory_movements`, `expenses` jadvallarini yaratish, triggerlar, indexlar, RLS. |
| **SUPABASE_INVENTORY_CONSUMPTIONS.sql** | `inventory_consumptions` jadvali va consumption yozilganda `inventory_movements` ga yozuv + zaxira yangilash triggeri. **Shart:** `inventory_items`, `inventory_movements`, `visits`, `patients`, `doctors` mavjud. |
| **SUPABASE_VISIT_SERVICES_MIGRATION.sql** | `visit_services` jadvali (visit_id, patient_id, doctor_id, service_name, price va h.k.), indexlar, RLS. **Shart:** `visits`, `patients`, `doctors` mavjud. |
| **SUPABASE_ODONTOGRAM_MIGRATION.sql** | `odontograms` jadvali (patient_id, visit_id, doctor_id, data JSONB), triggerlar (id generatsiya, validation), RLS. **Shart:** `patients`, `visits`, `doctors` mavjud. |
| **SUPABASE_TREATMENT_PLANS_MIGRATION.sql** | `treatment_plans` jadvali (patient_id, doctor_id, visit_id, title, planned_date, status va h.k.), triggerlar, RLS. **Shart:** `patients`, `doctors`, `visits` mavjud. |
| **SUPABASE_SERVICE_PRICE_AUDIT.sql** | `service_price_audit` jadvali (narx o‘zgarishlari audit), `clinic_id` / `changed_at` qo‘shish, RLS, `services` da narx o‘zgarganda yozadigan trigger. **Shart:** `clinics` va `services` jadvallari mavjud bo‘lishi ma’qul. |

---

## 2. Bog‘liqliklar (qaysi jadval qaysidan keyin kerak)

- **clinics** — SUPER_ADMIN_MIGRATION da yaratiladi; boshqa ko‘p migratsiyalar `clinics(id)` ga ishonadi.
- **patients**, **doctors** — loyihada alohida `CREATE TABLE patients/doctors` migratsiyasi yo‘q; ular **Supabase da allaqachon mavjud** deb hisoblanadi (qo‘lda yoki boshqa skript orqali yaratilgan).
- **visits** — VISITS_MIGRATION yoki VISITS_MIGRATION_SIMPLE dan keyin mavjud; keyin APPOINTMENTS, TENANT_ISOLATION, INCOME (payments.visit_id) ishlatadi.
- **payments** — INCOME_MIGRATION da yaratiladi; keyin TENANT_ISOLATION da `clinic_id` qo‘shiladi.
- **inventory_items**, **inventory_movements**, **expenses** — INVENTORY_MIGRATION da; keyin TENANT_ISOLATION_OMBOR_XIZMATLAR da `clinic_id`.
- **visit_services** — VISIT_SERVICES_MIGRATION da; keyin TENANT_ISOLATION_OMBOR_XIZMATLAR da `clinic_id`.
- **inventory_consumptions** — INVENTORY_CONSUMPTIONS da; TENANT_ISOLATION_OMBOR_XIZMATLAR triggerda `clinic_id` ishlatadi (visits orqali).
- **services**, **service_packages** va h.k. — ilovada ishlatiladi; agar jadvallar boshqa joyda yaratilmagan bo‘lsa, ularni yaratish kerak (yoki loyihada bitta “baza jadvallari” skripti bor). SERVICE_PRICE_AUDIT `services` ga trigger bog‘laydi.

---

## 3. SQL Editor da qanday tartibda tashlash kerak

Quyidagi tartib **bitta klinika uchun yozilgan bazani keyin ko‘p klinikali qilish** uchun mo‘ljallangan. Agar baza hali bo‘sh bo‘lsa, 1–2 qadamda `patients` va `doctors` jadvallarini avval yaratishingiz kerak (yoki ular mavjud bo‘lsa, 1-qadamdan boshlang).

| Tartib | Qaysi faylni tashlash | Sabab |
|--------|------------------------|--------|
| **0** | (Ixtiyoriy) `patients` va `doctors` jadvallarini yaratuvchi skript | Agar ular Supabase da yo‘q bo‘lsa; loyihada alohida SQL yo‘q, kerak bo‘lsa yozib beramiz. |
| **1** | **SUPABASE_SUPER_ADMIN_MIGRATION.sql** | Klinikalar, profiles, clinic_admins, doctors ga clinic_id; default klinika. |
| **2** | **SUPABASE_VISITS_MIGRATION.sql** *yoki* **SUPABASE_VISITS_MIGRATION_SIMPLE.sql** (bittasi) | Visits jadvali va triggerlar. |
| **3** | **SUPABASE_INCOME_MIGRATION.sql** | Payments jadvali va daromad viewlari. |
| **4** | **SUPABASE_TENANT_ISOLATION.sql** | patients, visits, payments ga clinic_id va backfill. |
| **5** | **SUPABASE_APPOINTMENTS_MIGRATION.sql** | Visits ga vaqt/xona ustunlari, visit_history va trigger. |
| **6** | **SUPABASE_DOCTORS_PROFILE_MIGRATION.sql** | doctors ga work_schedule. |
| **7** | **SUPABASE_INVENTORY_MIGRATION.sql** | inventory_items, inventory_movements, expenses. |
| **8** | **SUPABASE_INVENTORY_CONSUMPTIONS.sql** | inventory_consumptions va trigger (movement + stock). |
| **9** | **SUPABASE_VISIT_SERVICES_MIGRATION.sql** | visit_services jadvali. |
| **10** | **SUPABASE_TENANT_ISOLATION_OMBOR_XIZMATLAR.sql** | Ombor/xizmatlar jadvallariga clinic_id, yangilangan trigger, clinic_id li income viewlari. |
| **11** | **SUPABASE_ODONTOGRAM_MIGRATION.sql** | odontograms jadvali va triggerlar. |
| **12** | **SUPABASE_TREATMENT_PLANS_MIGRATION.sql** | treatment_plans jadvali. |
| **13** | **SUPABASE_SERVICE_PRICE_AUDIT.sql** | service_price_audit va services narx triggeri. |

**Tashlamaslik kerak (yoki faqat kerak bo‘lsa):**

- **SUPABASE_CLINIC_ADMINS_ONLY.sql** — SUPER_ADMIN_MIGRATION ni ishlatgan bo‘lsangiz, odatda kerak emas (clinic_admins allaqachon bor).
- **SUPABASE_VISITS_MIGRATION.sql** va **SUPABASE_VISITS_MIGRATION_SIMPLE.sql** — ikkalasini ham emas, **bittasini** tanlang (masalan, SIMPLE ni).

---

## 4. Trigger sintaksisi (EXECUTE FUNCTION / EXECUTE PROCEDURE)

Ba’zi fayllarda triggerlar `EXECUTE FUNCTION` bilan yozilgan (PostgreSQL 11+). Agar Supabase eski Postgres ishlatib, **"syntax error at or near FUNCTION"** bersa, shu triggerlarda `EXECUTE FUNCTION` ni `EXECUTE PROCEDURE` ga almashtiring (faqat trigger qatorida).

---

## 5. Qisqacha: SQL Editor da nimalarni ketma-ket tashlash kerak

1. **SUPABASE_SUPER_ADMIN_MIGRATION.sql**
2. **SUPABASE_VISITS_MIGRATION_SIMPLE.sql** (yoki VISITS_MIGRATION)
3. **SUPABASE_INCOME_MIGRATION.sql**
4. **SUPABASE_TENANT_ISOLATION.sql**
5. **SUPABASE_APPOINTMENTS_MIGRATION.sql**
6. **SUPABASE_DOCTORS_PROFILE_MIGRATION.sql**
7. **SUPABASE_INVENTORY_MIGRATION.sql**
8. **SUPABASE_INVENTORY_CONSUMPTIONS.sql**
9. **SUPABASE_VISIT_SERVICES_MIGRATION.sql**
10. **SUPABASE_TENANT_ISOLATION_OMBOR_XIZMATLAR.sql**
11. **SUPABASE_ODONTOGRAM_MIGRATION.sql**
12. **SUPABASE_TREATMENT_PLANS_MIGRATION.sql**
13. **SUPABASE_SERVICE_PRICE_AUDIT.sql**

Har bir faylni **bitta-bitta** SQL Editor ga yopishtirib, **Run** qiling. Xato chiqsa, xabarni saqlab, keyingi qadamga o‘tishdan oldin tuzating (masalan, jadval allaqachon mavjud, constraint mavjud va h.k.).
