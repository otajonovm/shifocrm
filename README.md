# ShifoApp CRM

Tibbiyot muassasasi uchun CRM tizimi - Doktorlar va Bemorlar boshqaruvi.

## Features / Xususiyatlar

- ✅ Admin Authentication
- ✅ Doctor Authentication (Supabase Auth)
- ✅ Doctors Management (CRUD)
- ✅ Doctor Profile Management
- ✅ Role-based Access Control
- ✅ Responsive UI (Tailwind CSS)

## Tech Stack / Texnologiyalar

- **Vue 3** - Composition API
- **Vite** - Build tool
- **Pinia** - State management
- **Vue Router** - Routing
- **Supabase** - Backend & Database
- **Tailwind CSS** - Styling

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup / Loyiha Sozlash

### 1. Dependencies O'rnatish

```sh
npm install
```

### 2. Environment Variables Sozlash

`.env` fayl yarating va quyidagilarni to'ldiring:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Sozlash

`DATABASE_SETUP.md` faylini o'qing va SQL migration larni ishga tushiring.

### 4. Development Server Ishga Tushirish

```sh
npm run dev
```

### 5. Production Build

```sh
npm run build
```

### 6. Code Linting

```sh
npm run lint
```

## Project Structure / Loyiha Strukturasi

```
src/
├── api/           # API calls
├── components/    # Reusable components
├── lib/           # Libraries (Supabase client)
├── router/        # Vue Router
├── stores/        # Pinia stores
└── views/         # Page components
```

## Authentication / Autentifikatsiya

### Admin Login
- Login: `admin`
- Password: `admin123` (db.json da)

### Doctor Login
- Email: Doctor email (admin tomonidan yaratiladi)
- Password: Admin tomonidan belgilanadi

## Database Setup / Database Sozlash

Batafsil ma'lumot uchun `DATABASE_SETUP.md` faylini o'qing.

## Development / Rivojlanish

Loyiha hozir development bosqichida. Keyingi qadamlar:

- [x] Patients Management
- [ ] Appointments System
- [ ] Reports & Analytics
- [ ] Notifications

## PWA (Progressive Web App)

ShifoCRM PWA sifatida ishlaydi - mobil qurilmalarga o'rnatish mumkin.

### O'rnatish (Install)

1. **Chrome/Edge (Desktop):**
   - Saytni oching
   - Address bar da "Install" ikonini bosing
   - Yoki Menu → "Install ShifoCRM"

2. **Android (Chrome):**
   - Saytni oching
   - Menu (⋮) → "Add to Home screen" / "Install app"

3. **iOS (Safari):**
   - Saytni oching
   - Share (↑) → "Add to Home Screen"

### PWA Test

```sh
# Production build
npm run build

# Preview (PWA faqat production build da ishlaydi)
npm run preview
```

Keyin `http://localhost:4173` da oching va PWA install tugmasini ko'rasiz.

### Eslatmalar

- **HTTPS kerak:** PWA faqat HTTPS yoki localhost da ishlaydi
- **Service Worker:** Offline qo'llab-quvvatlash uchun avtomatik generatsiya qilinadi
- **Auto-update:** Yangi versiya chiqsa avtomatik yangilanadi

### Icon yangilash

O'z logongizni ishlatish uchun:

```sh
# scripts/generate-pwa-icons.js dagi SVG ni o'zgartiring
# Keyin qayta generatsiya qiling:
node scripts/generate-pwa-icons.js
```

## Support / Yordam

Savollar bo'lsa:
- `DATABASE_SETUP.md` - Database sozlash
- `RECOMMENDATIONS.md` - Tavsiyalar va qo'shimchalar
- `PROJECT_ANALYSIS.md` - Loyiha tahlili
