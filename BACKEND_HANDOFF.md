# Backend Handoff (ShifoCRM)

Bu hujjat backendchi sherik loyihani tez tushunib, Supabase'dan boshqa serverga ko'chirishni oson bajarishi uchun yozildi.

## 1) Loyiha qisqacha
- Frontend: Vue 3 + Pinia + Tailwind
- Hozirgi backend: Supabase REST (Postgres)
- Hamma API chaqiruvlar `src/api/*.js` orqali ketadi

## 2) Asosiy modullar
- Auth/Login (frontend-local): `src/stores/auth.js`
- Patients / Doctors / Visits / Appointments
- Payments (tushum/qarz/refund)
- Services (xizmatlar/paketlar/chegirmalar)
- Reports (daromad, to'lovlar, top xizmatlar)
- Inventory (ombor, kirim/chiqim, harajatlar)
- Odontogram (visitlar bilan ishlaydi)

## 3) DB migratsiyalar (SQL fayllar)
Repo ichida mavjud:
- `SUPABASE_VISITS_MIGRATION.sql`
- `SUPABASE_VISIT_SERVICES_MIGRATION.sql`
- `SUPABASE_INCOME_MIGRATION.sql`
- `SUPABASE_SERVICES_MIGRATION.sql` (agar yaratilgan bo'lsa)
- `SUPABASE_INVENTORY_MIGRATION.sql`
- `SUPABASE_INVENTORY_CONSUMPTIONS.sql`
- `SUPABASE_ODONTOGRAM_MIGRATION.sql`
- `SUPABASE_TREATMENT_PLANS_MIGRATION.sql`

Ko'chirishda shu fayllarni yangi Postgres bazaga tartib bilan ishlatish kerak.

## 4) API qatlam (Frontend qayerga ulanadi)
Frontend API fayllari:
- `src/api/supabaseConfig.js` (asosiy REST konfiguratsiya)
- `src/api/patientsApi.js`
- `src/api/doctorsApi.js`
- `src/api/visitsApi.js`
- `src/api/paymentsApi.js`
- `src/api/servicesApi.js`
- `src/api/visitServicesApi.js`
- `src/api/odontogramApi.js`
- `src/api/treatmentPlansApi.js`
- `src/api/inventoryApi.js`

Backendchi kelganda:
- Supabase o'rniga boshqa REST server qo'yiladi
- `supabaseConfig.js` o'rniga HTTP client yoziladi (token bilan)
- Endpointlar naming: `/{table}` ko'rinishida qolsa ko'chirish juda oson

## 5) Auth / Role (hozirgi holat)
- Admin login: `db.json` ichidan tekshiriladi (frontend)
- Doctor login: `doctors` jadvalidan email/password (plain)
- JWT token yo'q
- Role: `admin`, `doctor` (solo hozir yo'q)

Backendchi uchun minimal kerakli:
- `/auth/login` -> JWT qaytaradi
- JWT payload: `{ sub, role }`
- Frontend Authorization: `Bearer <token>`

## 6) Inventory sarfi (doctor ishlatgan material)
- Odontogramda "Material sarfi" bo'limi bor
- `inventory_consumptions` jadvali insert bo'lsa:
  - trigger `inventory_movements` ga `type=out` yozadi
  - `inventory_items.current_stock` kamayadi
- Omborda chiqimlar bo'limida `doctor_id` va `visit_id` ko'rinadi

## 7) Reports uchun kerakli viewlar
Supabase viewlar:
- `income_daily`, `income_monthly` (payments migratsiya faylida)
- `service_revenue_monthly`, `top_services` (services stats)

## 8) Ko'chirish uchun minimal plan
1. Yangi Postgres server
2. SQL migratsiyalarni ishlatish
3. PostgREST yoki Node API
4. Auth endpoint + JWT
5. Frontend API konfiguratsiyasini almashtirish

## 9) Frontend ichida role ishlatiladigan joylar
- Router guard: `src/router/index.js`
- Sidebar menu: `src/components/layout/Sidebar.vue`
- Dashboard viewlar: `src/views/DashboardView.vue`

## 10) Muhim eslatmalar
- Supabase RLS hozir `public` tarzida; yangi backendda server-side auth qilinadi
- Passwordlar hozir plain text; backendchi bcrypt qilish kerak

---
Agar backendchi qo'shimcha savol bersa:
- SQL fayllar repo ichida tayyor
- Frontend endpointlar Supabase REST formatida yozilgan
