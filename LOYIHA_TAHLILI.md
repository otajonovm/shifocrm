# ShifoCRM - Loyiha Tahlili

## Qisqacha Ma'lumot

**Loyiha nomi:** ShifoCRM  
**Maqsad:** Tibbiy muassasalar uchun CRM tizimi  
**Texnologiya:** Vue.js 3 + Supabase  
**Status:** Rivojlanish bosqichida (Phase 1 tugallangan)

---

## Loyiha Haqida

ShifoCRM - bu shifokorlar va bemorlarni boshqarish, qabullarni rejalashtirish va tibbiy ma'lumotlarni saqlash uchun mo'ljallangan zamonaviy veb-ilova. Loyiha tibbiyot sohasiga ixtisoslashgan CRM platformasi sifatida ishlab chiqilmoqda.

---

## Asosiy Imkoniyatlar

### ✅ Hozirda Mavjud

1. **Autentifikatsiya**
   - Admin kirish tizimi
   - Login: `admin`
   - Parol: `admin123`

2. **Dashboard (Boshqaruv Paneli)**
   - Markaziy boshqaruv interfeysi
   - Modullarga tezkor kirish

3. **Shifokorlarni Boshqarish**
   - Yangi shifokor qo'shish
   - Shifokorlar ro'yxatini ko'rish
   - Shifokorni o'chirish
   - Aktiv/Noaktiv status
   - Maksimal 4 ta shifokor

### 🔜 Rejalashtirilgan

- Bemorlarni boshqarish
- Qabullarni rejalashtirish
- Tibbiy kartalar
- SMS xabarnomalar
- Hisobotlar va statistika

---

## Texnologiyalar

### Frontend
- **Vue.js 3.5.26** - Asosiy framework
- **Pinia 3.0.4** - State management
- **Vue Router 4.6.4** - Navigatsiya
- **Tailwind CSS 3.4.17** - Stil va dizayn
- **Vite 7.3.0** - Build tool

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Ma'lumotlar bazasi

---

## Loyiha Strukturasi

```
shifocrm/
├── src/
│   ├── api/              - API integratsiya
│   ├── stores/           - State management (Pinia)
│   ├── router/           - Marshrutlar
│   ├── views/            - Sahifalar
│   ├── lib/              - Yordamchi kutubxonalar
│   └── assets/           - Statik fayllar
├── db.json               - Admin ma'lumotlari
├── package.json          - Bog'liqliklar
└── vite.config.js        - Vite konfiguratsiya
```

---

## Sahifalar (Views)

1. **LoginView** (`/login`)
   - Tizimga kirish sahifasi
   - Admin autentifikatsiyasi

2. **DashboardView** (`/dashboard`)
   - Asosiy boshqaruv paneli
   - Modullarga kirish

3. **DoctorsView** (`/doctors`)
   - Shifokorlarni boshqarish
   - CRUD operatsiyalar
   - Faqat admin uchun

---

## Ma'lumotlar Bazasi

### Doctors (Shifokorlar) Jadvali

```
- id: UUID (unikal identifikator)
- full_name: TEXT (to'liq ism)
- phone: TEXT (telefon raqam)
- is_active: BOOLEAN (aktiv/noaktiv)
- created_at: TIMESTAMP (yaratilgan vaqt)
```

---

## O'rnatish

### 1. Repository yuklab olish
```bash
git clone <repository-url>
cd shifocrm
```

### 2. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 3. Environment o'zgaruvchilarini sozlash
```bash
# .env fayl yaratish
VITE_SUPABASE_URL=sizning_supabase_url
VITE_SUPABASE_ANON_KEY=sizning_supabase_key
```

### 4. Ishga tushirish
```bash
npm run dev
```

Brauzerda ochiladi: `http://localhost:5173`

---

## Foydalanish

1. **Tizimga kirish:**
   - Login: `admin`
   - Parol: `admin123`

2. **Shifokor qo'shish:**
   - Dashboard → Manage Doctors
   - "Add New Doctor" formasini to'ldirish
   - To'liq ism va telefon raqamni kiritish
   - "Add Doctor" tugmasini bosish

3. **Shifokorni o'chirish:**
   - Shifokorlar ro'yxatidan kerakli shifokorni topish
   - "Delete" tugmasini bosish
   - Tasdiqlash

---

## Xavfsizlik Eslatmalari

⚠️ **MUHIM:**
- `db.json` faylini production muhitiga joylashtirmang
- Parollarni environment variables orqali boshqaring
- HTTPS protokolidan foydalaning
- Supabase RLS (Row Level Security) sozlang

---

## Tizim Talablari

- **Node.js:** 20.19.0+ yoki 22.12.0+
- **NPM:** 9.0.0+
- **Brauzer:** Chrome, Firefox, Safari, Edge (so'nggi versiyalar)
- **Internet:** Supabase backend bilan aloqa uchun

---

## Scriptlar

```bash
npm run dev      # Development server ishga tushirish
npm run build    # Production uchun build
npm run preview  # Production build'ni ko'rish
npm run lint     # Kodni tekshirish
```

---

## Kelajak Rejalari

### Yaqin Kelajak (2-3 oy)
- ✅ Shifokorlarni tahrirlash funksiyasi
- 📋 Bemorlar moduli
- 📅 Qabullar kalendari
- 🔍 Qidiruv va filterlash

### O'rta Muddatli (6 oy)
- 📊 Hisobotlar va statistika
- 📱 SMS xabarnomalar
- 🌐 Ko'p tilli interfeys (O'zbek, Rus, Ingliz)
- 📋 Tibbiy kartalar

### Uzoq Muddatli (1 yil)
- 📱 Mobil ilova
- 🏥 Multi-clinic support
- 📹 Telemeditsina
- 🤖 AI-powered recommendations

---

## Ma'lum Muammolar

1. **Maksimal 4 shifokor** - hozircha limitatsiya bor
2. **Tahrirlash funksiyasi** - frontend'da to'liq ishlamaydi
3. **Xavfsizlik** - production uchun yaxshilash kerak
4. **Testlar** - unit va e2e testlar yo'q
5. **Mobil** - ba'zi sahifalar to'liq responsive emas

---

## Yordam va Qo'llab-quvvatlash

### Texnik Hujjatlar
- Vue.js: https://vuejs.org/
- Tailwind CSS: https://tailwindcss.com/
- Supabase: https://supabase.com/docs

### Repository
- GitHub: otajonovm/shifocrm

---

## Litsenziya

*[Litsenziya ko'rsatilmagan]*

---

**Versiya:** 0.0.0  
**Status:** Rivojlanish Bosqichida - Phase 1
