# ShifoCRM - Project Analysis

## 📋 Loyihaga Umumiy Baxo (Project Overview)

**ShifoCRM** - bu tibbiy muassasalar uchun mo'ljallangan Customer Relationship Management (CRM) tizimi. Loyiha Vue.js 3 frameworki asosida qurilgan zamonaviy single-page application (SPA) hisoblanadi.

**ShifoCRM** is a Customer Relationship Management (CRM) system designed for medical institutions. The project is a modern single-page application (SPA) built on the Vue.js 3 framework.

---

## 🎯 Asosiy Maqsad (Main Purpose)

Shifokorlar va bemorlarni boshqarish, qabullarni rejalashtirish va tibbiy ma'lumotlarni markazlashtirilgan tarzda saqlash imkonini beruvchi tibbiyot sohasiga ixtisoslashtirilgan CRM platformasi.

The main purpose is to provide a specialized CRM platform for healthcare that enables managing doctors and patients, scheduling appointments, and storing medical information in a centralized manner.

---

## 🛠 Texnologik Stek (Technology Stack)

### Frontend Framework
- **Vue.js 3.5.26** - Progressiv JavaScript framework
- **Vue Router 4.6.4** - Client-side routing
- **Pinia 3.0.4** - State management (Vuex'ning zamonaviy muqobili)

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS preprocessing
- **Autoprefixer 10.4.23** - Automatic vendor prefixing

### Backend/Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication APIs
  - Storage APIs

### Build Tools & Development
- **Vite 7.3.0** - Next generation frontend tooling
- **ESLint 9.39.2** - Code linting va kod sifatini nazorat qilish
- **Vue DevTools 8.0.5** - Development va debugging uchun

### Node.js Requirements
- Node.js ^20.19.0 yoki >=22.12.0

---

## 📁 Loyiha Strukturasi (Project Structure)

```
shifocrm/
├── src/
│   ├── api/                    # API integration layer
│   │   └── doctorsApi.js       # Shifokorlar bilan ishlash API
│   ├── assets/                 # Static assets (images, styles)
│   ├── lib/                    # Utility libraries
│   │   └── supabaseClient.js   # Supabase client configuration
│   ├── router/                 # Vue Router configuration
│   │   └── index.js            # Route definitions va navigation guards
│   ├── stores/                 # Pinia state management
│   │   ├── auth.js             # Authentication store
│   │   ├── counter.js          # Example counter store
│   │   └── doctors.js          # Doctors management store
│   ├── views/                  # Page components
│   │   ├── DashboardView.vue   # Asosiy dashboard sahifasi
│   │   ├── DoctorsView.vue     # Shifokorlarni boshqarish sahifasi
│   │   └── LoginView.vue       # Login/authentication sahifasi
│   ├── App.vue                 # Root component
│   └── main.js                 # Application entry point
├── .vscode/                    # VS Code configuration
├── db.json                     # Local admin credentials
├── index.html                  # HTML entry point
├── package.json                # Dependencies va scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── eslint.config.js            # ESLint rules
└── postcss.config.js           # PostCSS configuration
```

---

## 🔑 Asosiy Xususiyatlar (Key Features)

### 1. **Autentifikatsiya Tizimi (Authentication System)**
- Admin uchun login/password autentifikatsiyasi
- LocalStorage orqali session boshqaruvi
- Route-level authentication guards
- Avtomatik login sahifasiga yo'naltirish

**Credentials (db.json):**
```json
{
  "login": "admin",
  "password": "admin123"
}
```

### 2. **Dashboard**
- Markazlashtirilgan boshqaruv paneli
- Tezkor navigatsiya modullarga
- Logout funksiyasi
- Responsive dizayn

### 3. **Shifokorlarni Boshqarish (Doctors Management)**
- ✅ Shifokorlarni qo'shish (Create)
- ✅ Shifokorlar ro'yxatini ko'rish (Read)
- ✅ Shifokorlarni o'chirish (Delete)
- ✅ Aktiv/Noaktiv status bilan ishlash
- ✅ Maksimal 4 ta shifokor limitatsiyasi
- ⏳ Shifokor ma'lumotlarini tahrirlash (Update) - kelajakda

**Doctor Model:**
```javascript
{
  id: UUID,
  full_name: String,
  phone: String,
  is_active: Boolean,
  created_at: Timestamp
}
```

### 4. **Rejalashtrilgan Modullar (Planned Modules)**
- 🔜 Bemorlar boshqaruvi (Patients Management)
- 🔜 Qabullar rejalashtirish (Appointments Scheduling)
- 🔜 Tibbiy kartalar (Medical Records)

---

## 🏗 Arxitektura va Ma'lumot Oqimi (Architecture & Data Flow)

### Component Hierarchy
```
App.vue
└── Router View
    ├── LoginView.vue (public)
    ├── DashboardView.vue (protected)
    └── DoctorsView.vue (protected, admin-only)
```

### State Management (Pinia Stores)

#### 1. **Auth Store (stores/auth.js)**
```javascript
State:
- isAuthenticated: Boolean
- userRole: String
- error: String|null

Actions:
- login({ login, password })
- logout()
```

#### 2. **Doctors Store (stores/doctors.js)**
```javascript
State:
- items: Array<Doctor>
- isLoading: Boolean
- error: String|null

Actions:
- fetchAll()          // Barcha shifokorlarni yuklash
- create(payload)     // Yangi shifokor qo'shish
- update(id, payload) // Shifokorni yangilash
- remove(id)          // Shifokorni o'chirish
```

### API Integration Flow

```
Vue Component
    ↓ dispatch action
Pinia Store
    ↓ call API function
API Layer (doctorsApi.js)
    ↓ execute query
Supabase Client
    ↓ HTTP request
Supabase Backend (PostgreSQL)
```

### Route Protection

```javascript
// router/index.js da navigation guards
beforeEach((to, from, next) => {
  // 1. Authenticated foydalanuvchilarni login sahifasidan boshqasiga yo'naltirish
  // 2. Protected routelar uchun authentication tekshirish
  // 3. Admin routelar uchun role tekshirish
})
```

---

## 🔐 Xavfsizlik (Security)

### Implemented
✅ Route-level authentication guards  
✅ Role-based access control (admin only for doctors management)  
✅ Client-side session management  
✅ Supabase Row Level Security (RLS) through backend  

### Recommendations for Production
⚠️ **CRITICAL**: db.json faylini production muhitiga kiritmaslik kerak  
⚠️ Environment variables (.env) orqali credentials boshqarish  
⚠️ HTTPS protokoli majburiy  
⚠️ JWT token-based authentication o'rniga o'tish  
⚠️ Password hashing va salting  
⚠️ Rate limiting API requests  

---

## 📊 Database Schema (Supabase)

### doctors Table
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Expected Future Tables
- `patients` - Bemorlar ma'lumotlari
- `appointments` - Qabullar jadvali
- `medical_records` - Tibbiy kartalar
- `users` - Tizim foydalanuvchilari

---

## 🚀 O'rnatish va Ishga Tushirish (Setup & Deployment)

### Prerequisites
- Node.js 20.19.0+ yoki 22.12.0+
- npm yoki yarn
- Supabase account va project

### Installation Steps

1. **Repository klonlash:**
```bash
git clone <repository-url>
cd shifocrm
```

2. **Dependencies o'rnatish:**
```bash
npm install
```

3. **Environment variables sozlash:**
```bash
# .env file yaratish
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Development server ishga tushirish:**
```bash
npm run dev
```

5. **Production build:**
```bash
npm run build
```

6. **Preview production build:**
```bash
npm run preview
```

### Available Scripts
```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",            // Production build
  "preview": "vite preview",        // Preview production build
  "lint": "eslint . --fix --cache"  // Run linter
}
```

---

## 🎨 Dizayn Tizimi (Design System)

### Color Palette
- **Primary**: Blue-600 (#2563eb)
- **Success**: Green-800 (#166534)
- **Error**: Red-600 (#dc2626)
- **Background**: Gray-50 (#f9fafb)
- **Surface**: White (#ffffff)

### Typography
- Base font: System fonts (sans-serif)
- Headings: Font-semibold to Font-bold
- Body: Text-sm to Text-base

### Spacing
Tailwind CSS spacing scale (4px increments):
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

---

## 📈 Kelajakdagi Rivojlantirish (Future Enhancements)

### Phase 2 - Core Features
- [ ] Bemorlarni boshqarish moduli
- [ ] Qabullar kalendari va bron qilish
- [ ] Shifokor-bemor bog'lanish
- [ ] Qidiruv va filterlash funksiyalari

### Phase 3 - Advanced Features
- [ ] Tibbiy kartalar va tarix
- [ ] SMS va email xabarnomalar
- [ ] Hisobotlar va statistika
- [ ] Multi-language support (O'zbek, Rus, Ingliz)

### Phase 4 - Enterprise Features
- [ ] Multi-tenant architecture
- [ ] Advanced analytics dashboard
- [ ] Integration with medical equipment
- [ ] Mobile application
- [ ] Telemeditsina funksiyalari

---

## 🐛 Ma'lum Muammolar va Cheklashlar (Known Issues & Limitations)

### Current Limitations
1. **Shifokor limiti**: Maksimal 4 ta shifokor qo'shish mumkin
2. **Update funksiyasi**: Shifokor ma'lumotlarini tahrirlash frontend'da ishlamaydi
3. **Autentifikatsiya**: Hardcoded credentials (db.json)
4. **Xavfsizlik**: Production-ready emas
5. **Responsive**: Ba'zi komponentlar mobil qurilmalarda to'liq optimallashtirilmagan

### Technical Debt
- Test coverage yo'q (unit tests, e2e tests kerak)
- Error handling yaxshilanishi kerak
- Loading states ba'zi joylarda yetishmas
- Accessibility (a11y) yaxshilanishi kerak
- Performance optimization kerak (lazy loading, code splitting)

---

## 📚 Resurslar va Qo'llanmalar (Resources & References)

### Documentation Links
- [Vue.js 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Code Style
- ESLint configuration: `eslint.config.js`
- Vue.js 3 Composition API
- Modern JavaScript (ES6+)

---

## 👥 Hissa Qo'shish (Contributing)

### Development Workflow
1. Feature branch yaratish
2. O'zgarishlarni qilish
3. Kodni lint qilish: `npm run lint`
4. Pull request ochish

### Code Quality Standards
- ESLint qoidalariga rioya qilish
- Vue.js best practices
- Responsive dizayn
- Accessibility standards (WCAG)

---

## 📝 License

Loyiha litsenziyasi: *[License not specified]*

---

## 📞 Aloqa (Contact)

Repository: otajonovm/shifocrm

---

**Versiya (Version):** 0.0.0  
**Status:** Active Development - Phase 1 Complete
