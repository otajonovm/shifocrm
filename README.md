# ShifoCRM 🏥

> Tibbiy muassasalar uchun zamonaviy CRM tizimi  
> Modern CRM System for Medical Institutions

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5.26-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

## 📋 Loyiha Haqida | About

**ShifoCRM** - bu shifokorlar va bemorlarni boshqarish, qabullarni rejalashtirish va tibbiy ma'lumotlarni markazlashtirilgan tarzda saqlash imkonini beruvchi zamonaviy CRM platformasi.

**ShifoCRM** is a modern CRM platform that enables managing doctors and patients, scheduling appointments, and storing medical information in a centralized manner.

## ✨ Asosiy Xususiyatlar | Key Features

- ✅ **Admin autentifikatsiya tizimi** | Admin authentication system
- ✅ **Shifokorlarni boshqarish** | Doctors management (CRUD operations)
- ✅ **Responsive dizayn** | Responsive design with Tailwind CSS
- ✅ **Real-time ma'lumotlar** | Real-time data with Supabase
- 🔜 **Bemorlar moduli** | Patients module (coming soon)
- 🔜 **Qabullar kalendari** | Appointments calendar (coming soon)

## 🚀 Tezkor Boshlash | Quick Start

### O'rnatish | Installation

```bash
# Repository yuklab olish | Clone the repository
git clone <repository-url>
cd shifocrm

# Bog'liqliklarni o'rnatish | Install dependencies
npm install

# Environment faylini sozlash | Setup environment variables
cp .env.example .env
# .env faylini Supabase ma'lumotlari bilan to'ldiring
# Fill .env file with your Supabase credentials
```

### Ishga Tushirish | Running

```bash
# Development server
npm run dev
# Brauzerda ochiladi: http://localhost:5173

# Production build
npm run build

# Preview production build
npm run preview

# Kodni tekshirish | Lint code
npm run lint
```

## 🔑 Kirish Ma'lumotlari | Login Credentials

```
Login: admin
Password: admin123
```

⚠️ **Eslatma:** Production muhitida db.json faylini o'chiring va xavfsiz autentifikatsiya tizimini qo'llang.  
⚠️ **Note:** Remove db.json in production and implement secure authentication.

## 📚 To'liq Hujjatlar | Full Documentation

Loyiha to'g'risida batafsil ma'lumot uchun quyidagi hujjatlarni o'qing:

For detailed information about the project, read the following documentation:

- 📖 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) - Ingliz tilida to'liq tahlil | Full analysis in English
- 📖 [LOYIHA_TAHLILI.md](./LOYIHA_TAHLILI.md) - O'zbek tilida qisqacha tahlil | Summary in Uzbek

## 🛠 Texnologiyalar | Technology Stack

- **Frontend:** Vue.js 3, Pinia, Vue Router
- **Styling:** Tailwind CSS, PostCSS
- **Backend:** Supabase (PostgreSQL)
- **Build Tool:** Vite
- **Code Quality:** ESLint

## 📁 Loyiha Strukturasi | Project Structure

```
shifocrm/
├── src/
│   ├── api/          # API integration
│   ├── stores/       # Pinia state management
│   ├── router/       # Vue Router configuration
│   ├── views/        # Page components
│   ├── lib/          # Utility libraries
│   └── assets/       # Static assets
├── db.json           # Admin credentials (dev only)
└── ...config files
```

## 🔧 Tizim Talablari | System Requirements

- Node.js: `^20.19.0 || >=22.12.0`
- npm: `9.0.0+`
- Modern browser with ES6+ support

## 🎨 Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🌐 Browser DevTools

### Chromium-based browsers (Chrome, Edge, Brave, etc.)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Turn on Custom Object Formatter](http://bit.ly/object-formatters)

### Firefox
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Turn on Custom Object Formatter](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## 🤝 Hissa Qo'shish | Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. O'zgarishlarni commit qiling (`git commit -m 'Add amazing feature'`)
4. Branch'ni push qiling (`git push origin feature/amazing-feature`)
5. Pull Request oching

## 📝 License

*[License not specified]*

## 📞 Aloqa | Contact

Repository: [otajonovm/shifocrm](https://github.com/otajonovm/shifocrm)

---

Made with ❤️ for Healthcare Professionals
