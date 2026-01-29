# ShifoCRM - To'liq Logika Tahlili

## 📋 Loyiha Umumiy Ko'rinishi

**ShifoCRM** - Tibbiyot klinikalari uchun CRM tizimi (Clinic Management System)

### Tech Stack
- **Frontend Framework:** Vue 3 (Composition API)
- **State Management:** Pinia
- **Routing:** Vue Router 4
- **UI Framework:** Tailwind CSS
- **Icons:** Heroicons Vue
- **Charts:** ApexCharts (vue3-apexcharts)
- **i18n:** Vue I18n (O'zbek/Rus tillari)
- **Backend:** Supabase (PostgreSQL + REST API)
- **Build Tool:** Vite

---

## 🏗️ Arxitektura Strukturasi

### 1. Folder Structure
```
src/
├── api/              # API layer (Supabase REST calls)
├── stores/           # Pinia stores (state management)
├── views/            # Page components
├── components/       # Reusable components
│   ├── admin/       # Admin-specific components
│   ├── doctor/      # Doctor-specific components
│   ├── patients/    # Patient-related components
│   ├── layout/      # Layout components (Sidebar)
│   ├── shared/      # Shared components
│   └── ui/          # UI components (badges, etc)
├── constants/       # Constants (statuses, etc)
├── composables/     # Composable functions
├── router/          # Vue Router configuration
├── layouts/         # Layout wrappers
├── i18n/            # Internationalization
└── lib/             # Utility libraries
```

---

## 🔐 Authentication & Authorization

### Auth Store (`src/stores/auth.js`)

**Login Types:**
1. **Admin Login:**
   - Credentials: `db.json` faylidan tekshiriladi
   - Role: `admin`
   - JWT token yo'q (frontend-only)
   - LocalStorage'da saqlanadi

2. **Doctor Login:**
   - Credentials: Supabase `doctors` jadvalidan
   - Email/password (plain text - security issue!)
   - Role: `doctor`
   - User object localStorage'da saqlanadi

**State:**
```javascript
{
  isAuthenticated: boolean,
  userRole: 'admin' | 'doctor' | null,
  userEmail: string | null,
  user: object | null,
  error: string | null
}
```

**Flow:**
```
LoginView → authStore.login() → localStorage → Router guard → Dashboard
```

**Security Issues:**
- ❌ Passwordlar plain text (bcrypt kerak)
- ❌ JWT token yo'q
- ❌ API'da authentication yo'q (Supabase RLS public)

---

## 📊 State Management (Pinia Stores)

### 1. Auth Store (`stores/auth.js`)
**Vazifasi:** Authentication va user session management

**State:**
- `isAuthenticated` - Login holati
- `userRole` - User roli (admin/doctor)
- `userEmail` - Doctor email
- `user` - User object

**Actions:**
- `login()` - Admin login
- `loginDoctor()` - Doctor login
- `logout()` - Chiqish

---

### 2. Patients Store (`stores/patients.js`)
**Vazifasi:** Bemorlar ma'lumotlarini boshqarish

**State:**
- `items[]` - Bemorlar ro'yxati
- `loading` - Yuklanish holati
- `error` - Xatoliklar
- `currentPatient` - Hozirgi tanlangan bemor

**Computed:**
- `totalPatients` - Jami bemorlar soni
- `activePatients` - Faol bemorlar soni
- `inactivePatients` - Nofaol bemorlar soni

**Actions:**
- `fetchPatients()` - Barcha bemorlarni yuklash
- `fetchPatientsByDoctor(doctorId)` - Doktor bemorlarini yuklash
- `fetchPatientById(id)` - ID bo'yicha bemor olish
- `addPatient(data)` - Yangi bemor qo'shish
- `editPatient(id, data)` - Bemorni yangilash
- `removePatient(id)` - Bemorni o'chirish

**Muhim Logika:**
- Bemor qo'shilganda avtomatik birinchi visit yaratiladi (`createFirstVisit: true`)
- ID format muammolari: String/Number conversion
- Store'da topilmasa API'dan qidirish

---

### 3. Doctors Store (`stores/doctors.js`)
**Vazifasi:** Doktorlar ma'lumotlarini boshqarish

**State:**
- `items[]` - Doktorlar ro'yxati
- `isLoading` - Yuklanish holati
- `error` - Xatoliklar

**Actions:**
- `fetchAll()` - Barcha doktorlarni yuklash
- `create(payload)` - Yangi doktor qo'shish (max 4 ta)
- `update(id, payload)` - Doktorni yangilash
- `remove(id)` - Doktorni o'chirish
- `getById(id)` - ID bo'yicha doktor olish

**Business Rules:**
- Maksimal 4 ta doktor qo'shish mumkin
- Doctor profile'da `work_schedule` (JSONB) maydoni bor

---

## 🔌 API Layer

### Supabase Config (`api/supabaseConfig.js`)

**Base URL:** `https://qwngzvtanjlkvdbkvbew.supabase.co/rest/v1`

**HTTP Methods:**
- `supabaseGet(table, query)` - GET request
- `supabasePost(table, data)` - POST request
- `supabasePatch(table, id, data)` - PATCH request
- `supabaseDelete(table, id)` - DELETE request

**Headers:**
```javascript
{
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}
```

**Query Format:**
- Supabase PostgREST query syntax
- Masalan: `id=eq.123&order=created_at.desc`
- Filter: `date=gte.2024-01-01&date=lte.2024-01-31`

---

### API Modules

#### 1. Patients API (`api/patientsApi.js`)
**Jadval:** `patients`

**Funksiyalar:**
- `listPatients()` - Barcha bemorlar
- `getPatientById(id)` - ID bo'yicha bemor
- `getPatientsByDoctorId(doctorId)` - Doktor bemorlari
- `createPatient(data)` - Yangi bemor (avtomatik visit yaratadi)
- `updatePatient(id, payload)` - Bemorni yangilash
- `deletePatient(id)` - Bemorni o'chirish

**Muhim Logika:**
- 5 xonali unique ID generatsiya (10000-99999)
- Bemor yaratilganda avtomatik birinchi visit yaratiladi
- `med_id` - Bemorning tibbiy ID raqami

---

#### 2. Visits API (`api/visitsApi.js`)
**Jadval:** `visits`

**Funksiyalar:**
- `listVisits(query)` - Barcha tashriflar
- `getVisitsByPatientId(patientId)` - Bemor tashriflari
- `getVisitsByDoctorId(doctorId)` - Doktor tashriflari
- `getVisitsByDate(date)` - Sana bo'yicha
- `getVisitsByDateRange(start, end)` - Sana oralig'i
- `getActiveVisit(patientId)` - Faol tashrif (pending/arrived/in_progress)
- `getDebtVisits(patientId)` - Qarzdor tashriflar
- `getPatientTotalDebt(patientId)` - Umumiy qarzdorlik
- `createVisit(data)` - Yangi tashrif
- `updateVisit(id, payload)` - Tashrifni yangilash
- `completeVisit(id)` - Tashrifni yakunlash
- `completeVisitWithDebt(id, debtAmount)` - Qarzdorlik bilan yakunlash
- `payDebt(id)` - Qarzdorlikni to'lash
- `deleteVisit(id)` - Tashrifni o'chirish

**Muhim Logika:**
- **Qarzdorlik hisoblash:** `debt_amount = price - paid_amount`
- **Status workflow:** pending → arrived → in_progress → completed_debt/completed_paid
- **Avtomatik qarzdorlik:** Agar price va paid_amount berilgan bo'lsa, debt_amount avtomatik hisoblanadi

---

#### 3. Payments API (`api/paymentsApi.js`)
**Jadval:** `payments`
**Viewlar:** `income_daily`, `income_monthly`

**Funksiyalar:**
- `listPayments(query)` - Barcha to'lovlar
- `getPaymentsByPatientId(patientId)` - Bemor to'lovlari
- `getPaymentsByVisitId(visitId)` - Tashrif to'lovlari
- `getPaymentsByDateRange(start, end)` - Sana oralig'i
- `createPayment(data)` - Yangi to'lov
- `updatePayment(id, payload)` - To'lovni yangilash
- `deletePayment(id)` - To'lovni o'chirish
- `getIncomeByDate(date)` - Kunlik daromad
- `getMonthlyIncome(query)` - Oylik daromad
- `getIncomeDailyRange(start, end)` - Kunlik daromad oralig'i

**Payment Types:**
- `payment` - To'lov
- `refund` - Qaytarilgan to'lov

**Payment Methods:**
- `cash` - Naqd
- `card` - Karta
- `transfer` - O'tkazma

---

#### 4. Services API (`api/servicesApi.js`)
**Jadvallar:** `services`, `service_packages`, `service_package_items`, `discount_rules`
**Viewlar:** `service_revenue_daily`, `service_revenue_monthly`, `top_services`

**Funksiyalar:**
- Services CRUD
- Packages CRUD
- Package items CRUD
- Discount rules CRUD
- Revenue stats

---

#### 5. Inventory API (`api/inventoryApi.js`)
**Jadvallar:** `inventory_items`, `inventory_movements`, `expenses`, `inventory_consumptions`

**Funksiyalar:**
- Items CRUD
- Movements CRUD (kirim/chiqim)
- Expenses CRUD
- Consumptions CRUD (doctor material sarfi)

**Muhim Logika:**
- `inventory_consumptions` insert bo'lsa:
  - Trigger `inventory_movements` ga `type=out` yozadi
  - `inventory_items.current_stock` kamayadi

---

#### 6. Odontogram API (`api/odontogramApi.js`)
**Jadval:** `odontograms`

**Funksiyalar:**
- Odontogram CRUD
- Tish holatini saqlash (JSONB format)

---

#### 7. Treatment Plans API (`api/treatmentPlansApi.js`)
**Jadval:** `treatment_plans`

**Funksiyalar:**
- Treatment plans CRUD
- Status management

---

## 🔄 Data Flow

### 1. Bemor Qo'shish Flow
```
PatientsView → Form submit → patientsStore.addPatient() 
→ patientsApi.createPatient() 
→ Supabase POST /patients 
→ Auto: visitsApi.createVisit() (first visit)
→ Store update → UI refresh
```

### 2. Tashrif Status O'zgarish Flow
```
AppointmentsView → Status button click 
→ visitsApi.updateVisit(id, { status: 'new_status' })
→ Supabase PATCH /visits?id=eq.{id}
→ Store refresh → UI update
```

### 3. To'lov Qo'shish Flow
```
PaymentsView → Form submit 
→ paymentsApi.createPayment()
→ Supabase POST /payments
→ visitsApi.updateVisit() (paid_amount yangilanadi)
→ debt_amount avtomatik hisoblanadi
→ UI refresh
```

---

## 🎯 Business Logic

### 1. Visit Status Workflow

**Statuslar:**
1. `pending` - Yozildi (onlayn yozilgan)
2. `arrived` - Keldi (klinikaga keldi)
3. `in_progress` - Davolanish boshlandi
4. `completed_debt` - Qarzdor (davolash tugadi, lekin qarz bor)
5. `completed_paid` - Yakunlandi (to'liq to'landi)
6. `cancelled` - Bekor qilingan
7. `no_show` - Kelmagan
8. `archived` - Arxivlangan

**Status O'zgarish Qoidalari:**
```
pending → arrived, cancelled, no_show
arrived → in_progress, cancelled, no_show
in_progress → completed_debt, completed_paid, cancelled
completed_debt → completed_paid (faqat debt_amount = 0 bo'lsa), archived
completed_paid → archived
cancelled → archived
no_show → archived
archived → (o'zgartirish mumkin emas)
```

**Implementation:**
- `src/constants/visitStatus.js` - Status konstantalar
- `getAllowedNextStatuses(currentStatus)` - Ruxsat berilgan statuslar
- `canChangeStatus(currentStatus, newStatus, debtAmount)` - O'zgartirish mumkinligi

---

### 2. Qarzdorlik (Debt) Logic

**Hisoblash:**
```javascript
debt_amount = price - paid_amount
```

**Qoidalar:**
- Agar `price` null yoki 0 bo'lsa → `debt_amount = null`
- Agar `paid_amount >= price` bo'lsa → `debt_amount = null`
- `completed_debt` statusiga o'tishda `debt_amount > 0` bo'lishi kerak
- `completed_paid` ga o'tish uchun `debt_amount = 0` yoki `null` bo'lishi kerak

**Avtomatik Hisoblash:**
- `createVisit()` - Agar price va paid_amount berilgan bo'lsa
- `updateVisit()` - Agar price yoki paid_amount o'zgarsa

---

### 3. Bemor Status Logic

**Statuslar:**
1. `active` - Faol
2. `inactive` - To'xtatilgan
3. `follow_up` - Qayta chaqirish
4. `archived` - Arxivlangan
5. `deceased` - Vafot etgan
6. `blocked` - Bloklangan

**Qoidalar:**
- Default status: `active`
- Admin barcha statuslarni ko'radi
- Doctor faqat: active, inactive, follow_up

---

### 4. ID Generation Logic

**Bemorlar va Tashriflar:**
- 5 xonali unique ID (10000-99999)
- Random generation + uniqueness check
- Fallback: timestamp-based ID

**Format Issues:**
- Supabase'da ID INTEGER (number)
- Frontend'da String/Number conversion muammolari
- Store'da va API'da format tekshiruvi

---

## 🛣️ Routing & Navigation

### Router Guard (`router/index.js`)

**Auth Check:**
```javascript
if (to.meta.requiresAuth && !authStore.isAuthenticated) {
  next({ name: 'login', query: { redirect: to.fullPath } })
}
```

**Role Check:**
```javascript
if (to.meta.requiresRole === 'admin' && authStore.userRole !== 'admin') {
  next({ name: 'dashboard' })
}
```

**Routes:**
- Public: `/login`
- Admin only: `/patients`, `/doctors`, `/appointments`, `/payments`, `/services`, `/reports`, `/inventory`
- Doctor only: `/my-patients`, `/my-appointments`, `/treatment-plans`, `/doctor/profile`
- Both: `/dashboard`, `/settings`, `/patients/:id`

---

## 🎨 Component Architecture

### Layout Components

**MainLayout (`layouts/MainLayout.vue`):**
- Sidebar navigation
- Header (search, notifications, user menu)
- Main content area
- Global search (admin only)
- Notifications dropdown
- User menu dropdown

**Sidebar (`components/layout/Sidebar.vue`):**
- Dynamic menu based on role
- Admin menu: Dashboard, Patients, Doctors, Appointments, Payments, Services, Inventory, Reports, Settings
- Doctor menu: Dashboard, My Patients, My Appointments, Treatment Plans, Profile

---

### View Components

**DashboardView:**
- Role-based dashboard rendering
- AdminDashboard + DoctorDashboard
- Solo role uchun ikkalasi ham ko'rsatiladi

**PatientsView:**
- Bemorlar ro'yxati
- Qidiruv va filtrlash
- CRUD operatsiyalar
- Status dropdown (custom)

**AppointmentsView:**
- Tashriflar jadvali
- Status workflow buttons
- Bulk operations
- Date range filtering

**PaymentsView:**
- To'lovlar ro'yxati
- Payment creation
- Refund handling
- Income statistics

**ReportsView:**
- Charts (ApexCharts)
- Payment methods stats
- Doctor revenue
- Debtors list
- Top services
- Monthly/daily income

---

## 📈 Data Relationships

### Database Schema (Supabase)

**Core Tables:**
1. `patients` - Bemorlar
2. `doctors` - Doktorlar
3. `visits` - Tashriflar
4. `payments` - To'lovlar
5. `services` - Xizmatlar
6. `service_packages` - Xizmat paketlari
7. `service_package_items` - Paket elementlari
8. `visit_services` - Tashrif xizmatlari
9. `inventory_items` - Ombordagi mahsulotlar
10. `inventory_movements` - Ombordagi harakatlar
11. `inventory_consumptions` - Material sarfi
12. `expenses` - Harajatlar
13. `odontograms` - Odontogrammalar
14. `treatment_plans` - Davolash rejalari

**Relationships:**
```
patients (1) ──→ (N) visits
doctors (1) ──→ (N) visits
doctors (1) ──→ (N) patients
visits (1) ──→ (N) payments
visits (1) ──→ (N) visit_services
visits (1) ──→ (1) odontograms
patients (1) ──→ (N) treatment_plans
inventory_items (1) ──→ (N) inventory_movements
inventory_items (1) ──→ (N) inventory_consumptions
visits (1) ──→ (N) inventory_consumptions
```

---

## 🔍 Key Features

### 1. Patient Management
- ✅ Bemorlar CRUD
- ✅ Status management (6 xil status)
- ✅ Doktor biriktirish
- ✅ Med ID (tibbiy ID raqami)
- ✅ Qidiruv va filtrlash
- ✅ Bemor profil (visits, odontogram, payments, plans)

### 2. Visit/Appointment Management
- ✅ 8 xil status workflow
- ✅ Status o'zgarish qoidalari
- ✅ Qarzdorlik hisoblash
- ✅ Sana va vaqt boshqaruvi
- ✅ Bulk operations
- ✅ Calendar view

### 3. Payment Management
- ✅ To'lovlar CRUD
- ✅ Qaytarilgan to'lovlar (refund)
- ✅ Payment methods (cash, card, transfer)
- ✅ Qarzdorlik to'lash
- ✅ Income statistics
- ✅ Daily/monthly reports

### 4. Services Management
- ✅ Xizmatlar CRUD
- ✅ Paketlar (packages)
- ✅ Chegirmalar (discounts)
- ✅ Narx audit
- ✅ Revenue statistics

### 5. Inventory Management
- ✅ Mahsulotlar CRUD
- ✅ Kirim/chiqim harakatlar
- ✅ Material sarfi (doctor ishlatgan)
- ✅ Harajatlar
- ✅ Stock management
- ✅ Trigger-based stock update

### 6. Reports & Analytics
- ✅ Payment methods chart
- ✅ Doctor revenue chart
- ✅ Debtors list
- ✅ Top services
- ✅ Monthly/daily income
- ✅ Service revenue stats

### 7. Odontogram
- ✅ Tish xaritasi
- ✅ Tish holatini saqlash
- ✅ Visit bilan bog'lash
- ✅ Material sarfi

### 8. Treatment Plans
- ✅ Davolash rejalari CRUD
- ✅ Status management

---

## ⚠️ Muhim Muammolar va Yaxshilanishlar

### Security Issues
1. **❌ Passwordlar plain text**
   - Hozir: Plain text saqlanadi
   - Kerak: bcrypt hashing

2. **❌ JWT token yo'q**
   - Hozir: localStorage'da role saqlanadi
   - Kerak: JWT token + refresh token

3. **❌ API authentication yo'q**
   - Hozir: Supabase RLS public
   - Kerak: Server-side authentication

### Data Issues
1. **ID Format Muammolari**
   - String/Number conversion muammolari
   - Store va API o'rtasida format nomuvofiqlik

2. **Error Handling**
   - Ba'zi joylarda error handling yetarli emas
   - User-friendly error messages kerak

### Performance Issues
1. **N+1 Query Problem**
   - Ba'zi joylarda ko'p API chaqiruvlar
   - Batch loading kerak

2. **Store Caching**
   - Store'da caching yo'q
   - Har safar API'dan yuklash

### Code Quality
1. **Code Duplication**
   - Ba'zi funksiyalar takrorlanadi
   - Composables yoki utilities kerak

2. **Type Safety**
   - TypeScript yo'q
   - Type errors mumkin

---

## 🎯 Asosiy Workflow'lar

### 1. Bemor Qo'shish va Birinchi Tashrif
```
1. Admin bemor qo'shadi (PatientsView)
2. createPatient() → Supabase
3. Avtomatik createVisit() (status: pending)
4. Bemor ro'yxatida ko'rinadi
5. Tashriflar ro'yxatida "Yozildi" statusida ko'rinadi
```

### 2. Tashrif Jarayoni
```
1. Bemor keladi → Status: pending → arrived
2. Doktor qabul qiladi → Status: arrived → in_progress
3. Davolash tugadi:
   - Agar to'liq to'landi → completed_paid
   - Agar qarz qoldi → completed_debt (debt_amount hisoblanadi)
4. Qarz to'langanda → completed_debt → completed_paid
5. Arxivlash → archived
```

### 3. To'lov Jarayoni
```
1. Payment yaratiladi (PaymentsView)
2. Visit'ning paid_amount yangilanadi
3. debt_amount avtomatik hisoblanadi
4. Agar debt_amount = 0 bo'lsa → status completed_paid ga o'zgaradi
```

### 4. Material Sarfi
```
1. Doctor odontogramda material ishlatadi
2. createInventoryConsumption() → Supabase
3. Trigger ishga tushadi:
   - inventory_movements ga type=out yoziladi
   - inventory_items.current_stock kamayadi
```

---

## 📝 Muhim Eslatmalar

### 1. ID Format
- Supabase'da ID INTEGER (number)
- Frontend'da String/Number conversion kerak
- `Number(id)` va `String(id)` tekshiruvi mavjud

### 2. Date Format
- Supabase: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Frontend: YYYY-MM-DD (date input uchun)

### 3. Status Workflow
- Status o'zgarish qoidalari qat'iy
- `getAllowedNextStatuses()` funksiyasi ishlatiladi
- Qarzdorlik tuzatilmasdan completed_paid ga o'tib ketmasin

### 4. Auto Calculations
- Qarzdorlik: `debt_amount = price - paid_amount`
- Stock: Trigger orqali avtomatik yangilanadi
- Income: Viewlar orqali hisoblanadi

---

## 🚀 Key Improvements Recommendations

### 1. Security
- [ ] JWT token authentication
- [ ] Password hashing (bcrypt)
- [ ] API authentication middleware
- [ ] Role-based API access

### 2. Performance
- [ ] Store caching
- [ ] Batch API calls
- [ ] Lazy loading
- [ ] Pagination

### 3. Code Quality
- [ ] TypeScript migration
- [ ] Unit tests
- [ ] E2E tests
- [ ] Code documentation

### 4. Features
- [ ] Real-time notifications
- [ ] Email/SMS notifications
- [ ] Export to Excel/PDF
- [ ] Advanced search
- [ ] Audit log

---

## 📚 Qo'shimcha Ma'lumotlar

### SQL Migrations
- `SUPABASE_VISITS_MIGRATION.sql` - Tashriflar jadvali
- `SUPABASE_INCOME_MIGRATION.sql` - Daromad viewlari
- `SUPABASE_INVENTORY_MIGRATION.sql` - Ombordagi jadvallar
- `SUPABASE_ODONTOGRAM_MIGRATION.sql` - Odontogramma jadvali
- Va boshqalar...

### Documentation Files
- `BACKEND_HANDOFF.md` - Backend developer uchun qo'llanma
- `VISIT_STATUS_WORKFLOW.md` - Status workflow tafsilotlari
- `I18N_GUIDE.md` - Tarjima qo'llanmasi

---

**Yakuniy Xulosa:**
Loyiha yaxshi strukturalashtirilgan, lekin security va performance yaxshilanishlari kerak. Asosiy funksionallik ishlaydi, business logic to'g'ri implementatsiya qilingan.
