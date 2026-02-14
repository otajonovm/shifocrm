# Telegram Bot Integratsiya - To'liq Yo'riqnoma

## Muammo: "Telegram API sozlanmagan" xatosi

Agar sizga "Telegram API sozlanmagan" xatosi ko'rsatilsa, quyidagi qadamlarni bajaring:

---

## QADAM 1: Telegram Bot Serverini Ishga Tushirish

### 1.1 Bot Loyihasini Topish

Telegram bot loyihasi alohida papkada bo'lishi kerak. Quyidagi joylardan birida bo'lishi mumkin:

- `../ShifoCRM_bot/` (ShifoCRM papkasidan tashqarida)
- `../shifocrm-telegram-bot/`
- Yoki boshqa joyda

### 1.2 Bot Serverini Ishga Tushirish

```bash
# Bot papkasiga kiring
cd ../ShifoCRM_bot  # yoki bot papkangiz nomi

# Dependencies o'rnatish (bir marta)
npm install

# Bot serverini ishga tushirish
npm start
# yoki
npm run dev
```

**Muhim:** Bot serveri `http://localhost:3001` da ishlashi kerak (yoki `.env` da ko'rsatilgan port).

---

## QADAM 2: ShifoCRM `.env` Faylini Sozlash

### 2.1 `.env` Faylini Tekshirish

ShifoCRM loyiha ildizida (package.json bilan bir papkada) `.env` fayl borligini tekshiring.

### 2.2 `.env` Faylga Telegram O'zgaruvchilarini Qo'shish

`.env` faylni oching va quyidagilarni qo'shing:

```env
# Telegram Bot API
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

**Eslatma:** 
- `VITE_TELEGRAM_API_KEY` bot serveridagi `BOT_API_KEY` bilan bir xil bo'lishi kerak
- Agar bot serveri boshqa portda ishlasa, portni o'zgartiring

### 2.3 `.env` Fayl Misoli

To'liq `.env` fayl quyidagicha ko'rinishi kerak:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Telegram Bot API
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

---

## QADAM 3: Development Server ni Qayta Ishga Tushirish

`.env` faylni o'zgartirgandan keyin, **muhim:** development server ni qayta ishga tushirish kerak!

```bash
# Eski server ni to'xtating (Ctrl+C)

# Yangi server ni ishga tushiring
npm run dev
```

**Sabab:** Vite `.env` faylni faqat server ishga tushganda o'qiydi.

---

## QADAM 4: Tekshirish

### 4.1 Bot Serveri Ishlamoqdamimi?

Brauzerda yoki Postman'da quyidagi URL'ni oching:

```
http://localhost:3001/api/send
```

Agar bot serveri ishlamoqda bo'lsa, xatolik yoki JSON javob ko'rasiz.

### 4.2 ShifoCRM'dan Xabar Yuborish

1. ShifoCRM'ni oching
2. Bemor sahifasiga kiring
3. "Telegram xabar yuborish" tugmasini bosing
4. Xabar matnini kiriting
5. "Yuborish" tugmasini bosing

---

## QADAM 5: Xatoliklarni Tuzatish

### Xatolik: "Telegram API sozlanmagan"

**Sabab:** `.env` faylda `VITE_TELEGRAM_API_URL` yo'q yoki noto'g'ri

**Yechim:**
1. `.env` faylni tekshiring
2. `VITE_TELEGRAM_API_URL=http://localhost:3001` qatorini qo'shing
3. Development server ni qayta ishga tushiring

### Xatolik: "CHAT_ID_NOT_FOUND"

**Sabab:** Patient Telegram bot'da ro'yxatdan o'tmagan

**Yechim:**
1. Patient Telegram bot'ga kirishi kerak
2. Bot'da `/register` buyrug'ini yuborishi kerak
3. Patient ID'ni kirishi kerak

### Xatolik: "UNAUTHORIZED"

**Sabab:** API kalit noto'g'ri

**Yechim:**
1. Bot serveridagi `.env` faylda `BOT_API_KEY` ni tekshiring
2. ShifoCRM `.env` faylda `VITE_TELEGRAM_API_KEY` ni tekshiring
3. Ikkalasi ham bir xil bo'lishi kerak

### Xatolik: CORS (Access-Control-Allow-Origin)

**Sabab:** Brauzer `localhost:5173` dan `localhost:3001` ga so'rov yuborayotganda bot serveri CORS header yubormayapti.

**Yechim (ShifoCRM'da allaqachon qilingan):** Development rejimida Vite proxy ishlatiladi. So'rovlar avval `localhost:5173/api/telegram/send` ga boradi, Vite ularni `localhost:3001/api/send` ga yo'naltiradi — CORS kerak emas. Development server ni qayta ishga tushiring (`npm run dev`).

---

## QADAM 6: Production (Vercel / boshqa server) — Ma'lumot ketmasligi va server xatoligi

Vercel yoki boshqa noutbookga deploy qilgach xabar yuborilsa "server xatolik" yoki ma'lumot ketmasa, quyidagilarni tekshiring.

### 6.1 Sabab

1. **Brauzer CORS** — ShifoCRM (masalan `https://shifocrm.vercel.app`) boshqa domen (bot URL) ga so'rov yuboradi; bot serveri `Access-Control-Allow-Origin` yubormasa brauzer bloklaydi.
2. **Noto'g'ri URL** — Production'da `VITE_TELEGRAM_API_URL` hali ham `localhost:3001` bo'lsa, foydalanuvchi brauzerida localhost mavjud emas, so'rov muvaffaqiyatsiz bo'ladi.
3. **Bot public emas** — Bot faqat mahalliy kompyuterdagi noutbookda ishlasa, internetdan unga kirib bo'lmaydi.

### 6.2 Yechim: Bot serverida CORS qo'shish

Bot loyihasida (Express ishlatilsa) **CORS** yoqilishi kerak. Bot papkasida:

```bash
npm install cors
```

**index.js yoki server faylida** (boshiga, boshqa middleware'lardan oldin):

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS — barcha frontend domenlaridan so'rovlarni qabul qilish
const allowedOrigins = [
  'http://localhost:5173',           // ShifoCRM local
  'https://shifocrm.vercel.app',     // Vercel (o'z domeningizni yozing)
  'https://your-app.vercel.app'      // Boshqa production URL
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));

// yoki oddiy: barcha originlarga ruxsat (faqat API key bilan himoyalangan bo'lsa)
// app.use(cors());
```

Agar `cors` paketini ishlatmasangiz, `/api/send` dan oldin qo'lda header qo'shing:

```javascript
app.use('/api/send', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // yoki aniq: 'https://shifocrm.vercel.app'
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

### 6.3 Bot ni public URL da ishlatish

- **Vercel / Railway / Render** da bot ni deploy qiling va **HTTPS** URL oling (masalan `https://shifocrm-bot.vercel.app`).
- Yoki noutbookda ishlatayotgan bo'lsangiz, **ngrok** yoki **localtunnel** bilan tunnel oching va berilgan `https://...` manzilni ishlating.

### 6.4 ShifoCRM (Vercel) da Environment Variables

1. Vercel Dashboard → loyihangiz → **Settings** → **Environment Variables**.
2. Qo'shing:
   - `VITE_TELEGRAM_API_URL` = **bot ning public HTTPS manzili** (masalan `https://shifocrm-bot.vercel.app`, oxirida `/` bo'lmasin).
   - `VITE_TELEGRAM_API_KEY` = bot dagi `BOT_API_KEY` bilan bir xil kalit.
3. **Save** dan keyin **Redeploy** qiling (Deployments → ... → Redeploy). Build qayta ishlaganda yangi env ishlaydi.

### 6.5 Eslatma

- `VITE_` o'zgaruvchilari build vaqtida frontend kodiga yoziladi. O'zgartirsangiz, **mutlako qayta deploy** qiling.
- Bot va ShifoCRM ikkalasi ham **HTTPS** da bo'lishi kerak (Vercel avtomatik beradi).

---

## QADAM 7: Production uchun Sozlash (qisqacha)

### 7.1 Bot Serverini Deploy Qilish

Bot serverini Vercel, Railway, Render'ga deploy qiling; CORS qo'shing (yuqoridagi 6.2).

### 7.2 ShifoCRM `.env` (local) / Vercel Environment Variables (production)

```env
# Production Telegram Bot API
VITE_TELEGRAM_API_URL=https://your-bot-domain.com
VITE_TELEGRAM_API_KEY=your-production-api-key
```

### 7.3 Build va Deploy

```bash
npm run build
# Vercel avtomatik build qiladi; env o'zgartirsangiz Redeploy qiling
```

---

## Tezkor Tekshirish Ro'yxati

**Local:**
- [ ] Bot serveri ishlamoqdamimi? (`http://localhost:3001`)
- [ ] `.env` faylda `VITE_TELEGRAM_API_URL` bormi?
- [ ] `.env` faylda `VITE_TELEGRAM_API_KEY` bormi?
- [ ] Development server qayta ishga tushirilganmi?
- [ ] Patient Telegram bot'da ro'yxatdan o'tganmi?
- [ ] API kalitlar bir xilmi?

**Production (Vercel / boshqa server):**
- [ ] Bot public HTTPS URL da deploy qilinganmi?
- [ ] Bot serverida CORS qo'shilganmi? (TELEGRAM_SETUP_GUIDE.md — 6.2)
- [ ] Vercel'da `VITE_TELEGRAM_API_URL` = bot ning HTTPS manzili
- [ ] Vercel'da `VITE_TELEGRAM_API_KEY` = bot dagi kalit
- [ ] Env o'zgartirgandan keyin Redeploy qilinganmi?

---

## Yordam

Agar muammo davom etsa:

1. Browser Console'ni oching (F12) va xatoliklarni ko'ring
2. Network tab'da API so'rovlarini tekshiring
3. Bot serveri log'larini ko'ring
4. `.env` fayl sintaksisini tekshiring (qo'shtirnoq yoki bo'sh joylar bo'lmasligi kerak)
