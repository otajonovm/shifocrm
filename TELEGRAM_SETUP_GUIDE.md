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

## QADAM 6: Production uchun Sozlash

Production'da ishlatish uchun:

### 6.1 Bot Serverini Deploy Qilish

Bot serverini Vercel, Railway, Render yoki boshqa hosting'ga deploy qiling.

### 6.2 `.env` Faylni Yangilash

```env
# Production Telegram Bot API
VITE_TELEGRAM_API_URL=https://your-bot-domain.com
VITE_TELEGRAM_API_KEY=your-production-api-key
```

### 6.3 Build va Deploy

```bash
npm run build
# Keyin build qilingan fayllarni hosting'ga yuklang
```

---

## Tezkor Tekshirish Ro'yxati

- [ ] Bot serveri ishlamoqdamimi? (`http://localhost:3001`)
- [ ] `.env` faylda `VITE_TELEGRAM_API_URL` bormi?
- [ ] `.env` faylda `VITE_TELEGRAM_API_KEY` bormi?
- [ ] Development server qayta ishga tushirilganmi?
- [ ] Patient Telegram bot'da ro'yxatdan o'tganmi?
- [ ] API kalitlar bir xilmi?

---

## Yordam

Agar muammo davom etsa:

1. Browser Console'ni oching (F12) va xatoliklarni ko'ring
2. Network tab'da API so'rovlarini tekshiring
3. Bot serveri log'larini ko'ring
4. `.env` fayl sintaksisini tekshiring (qo'shtirnoq yoki bo'sh joylar bo'lmasligi kerak)
