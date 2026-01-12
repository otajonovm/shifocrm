# ShifoApp CRM

Bu shifo klinikasi uchun Vue 3 texnologiyasida yaratilgan CRM tizimi.

## Hozirgi Funksiyalar

- ✅ Admin kirish tizimi
- ✅ Doktorlarni boshqarish (CRUD operatsiyalari)
- ✅ O'zbek va Ingliz tillarida interfeys
- ✅ Responsiv dizayn (mobil va desktop)
- ✅ Supabase backend integratsiyasi

## Texnologiyalar

- **Frontend:** Vue 3 + Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Code Quality:** ESLint

## O'rnatish

### 1. Dasturni yuklab oling
```bash
git clone https://github.com/otajonovm/shifocrm.git
cd shifocrm
```

### 2. Bog'liqliklarni o'rnating
```bash
npm install
```

### 3. Environment o'zgaruvchilarni sozlang
`.env.example` faylidan `.env` yarating va ma'lumotlarni to'ldiring:
```bash
cp .env.example .env
```

`.env` fayliga Supabase ma'lumotlarini kiriting:
```
VITE_SUPABASE_URL=sizning_supabase_url
VITE_SUPABASE_ANON_KEY=sizning_supabase_anon_key
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=admin123
```

### 4. Development rejimida ishga tushiring
```bash
npm run dev
```

Brauzeringizda `http://localhost:5173` manzilini oching.

### 5. Production uchun build qilish
```bash
npm run build
```

### 6. Kodni tekshirish (Lint)
```bash
npm run lint
```

## Admin Login Ma'lumotlari

- **Login:** admin
- **Parol:** admin123

> ⚠️ **Ogohlantirish:** Production muhitida albatta parolni o'zgartiring!

## Loyiha Strukturasi

```
shifocrm/
├── src/
│   ├── api/          # API chaqiruvlari
│   ├── assets/       # Rasmlar va statik fayllar
│   ├── constants/    # Konstantalar va xabarlar
│   ├── lib/          # Kutubxonalar (Supabase)
│   ├── router/       # Vue Router konfiguratsiyasi
│   ├── stores/       # Pinia store'lar
│   ├── views/        # Sahifalar
│   ├── App.vue       # Asosiy komponent
│   └── main.js       # Kirish nuqtasi
├── .env.example      # Environment o'zgaruvchilar namunasi
├── db.json           # Admin ma'lumotlari (dev uchun)
├── package.json      # Dependencies
└── README.md         # Bu fayl
```

## Keyingi Rejalar

- [ ] Bemorlar moduli
- [ ] Qabullar (appointments) tizimi
- [ ] Hisobotlar va statistika
- [ ] Qidiruv funksiyasi
- [ ] Ma'lumotlarni eksport qilish
- [ ] Email bildirishnomalar
- [ ] Ko'p tillilik (O'zbek/Rus/Ingliz)

## Tavsiya Etilgan IDE Sozlamalari

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension

## Tavsiya Etilgan Brauzer Sozlamalari

- Chromium-asosli brauzerlar (Chrome, Edge, Brave):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## Muammolar

Agar muammo yoki takliflaringiz bo'lsa, [Issues](https://github.com/otajonovm/shifocrm/issues) bo'limida yozing.

## Litsenziya

Bu loyiha shaxsiy foydalanish uchun.

---

## English Version

# ShifoApp CRM

A CRM system for medical clinics built with Vue 3.

## Current Features

- ✅ Admin authentication
- ✅ Doctors management (CRUD operations)
- ✅ Uzbek and English interface
- ✅ Responsive design (mobile and desktop)
- ✅ Supabase backend integration

## Tech Stack

- **Frontend:** Vue 3 + Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Code Quality:** ESLint

## Installation

See Uzbek section above for detailed installation instructions.

## License

This project is for personal use.

