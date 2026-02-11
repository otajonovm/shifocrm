# Cursor prompt: Telegram bot (alohida loyiha) + ShifoCRM integratsiya

Quyidagi matnni Cursor ga copy-paste qiling. Telegram bot alohida papkada yaratiladi va keyin ShifoCRM bilan bog'lanadi.

---

## PROMPT (Copy-paste qiling)

```
Telegram botni alohida loyiha sifatida yarat va keyin hozirgi ShifoCRM loyihasi bilan birlashtir.

### 1. Alohida loyiha yaratish
- Desktop da (yoki shifocrm bilan bir darajada) yangi papka yarat: `shifocrm-telegram-bot`
- Ichida to'liq ishlaydigan Node.js Telegram bot:
  - node-telegram-bot-api, express, dotenv
  - Bot: /start, /help, /register
  - Bemor telefon raqam yoki ID orqali o'zini ro'yxatdan o'tkazadi
  - Express server: POST /api/send — patient_id va message qabul qiladi, Telegram ga yuboradi
  - Supabase bilan: telegram_chat_ids jadvali (patient_id, chat_id), getTelegramChatId(patientId), saveTelegramChatId
  - .env.example: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT
  - README: qanday token olish, qanday ishga tushirish, qanday deploy qilish (Vercel/Railway/Render)

### 2. ShifoCRM bilan birlashtirish
- ShifoCRM loyihasida (shifocrm/) faqat integratsiya qismi qolsın:
  - src/api/telegramApi.js: sendTelegramNotification({ patientId, message }), sendAppointmentReminder, sendDebtReminder — bular fetch orqali alohida bot serverga so'rov yuboradi (VITE_TELEGRAM_API_URL)
  - .env.example ga qo'sh: VITE_TELEGRAM_API_URL=https://your-bot-url.com
  - Bitta qisqa TELEGRAM_INTEGRATION.md: bot alohida loyiha ekani, qayerda (path), qanday ishga tushirish, frontend qanday bog'lashi kerak

### 3. Database
- Supabase da telegram_chat_ids jadvali kerak. SQL migration ni bot loyihasida (shifocrm-telegram-bot/) ber: patient_id, chat_id, username, first_name, created_at, updated_at. ShifoCRM da migration ishlamasın, faqat hujjatda “Supabase da shu SQL ni ishga tushiring” degan bo'lsin.

### Talablar
- Bot loyihasi to'liq mustaqil: o'zi o'zini ishga tushiradi, ShifoCRM kodiga bog'liq bo'lmasin.
- ShifoCRM faqat HTTP (fetch) orqali bot serverga xabar yuboradi; bot kodi ShifoCRM ichida bo'lmasin.
- Ikkala loyiha uchun ham aniq README / TELEGRAM_INTEGRATION.md bo'lsin.
```

---

## Qisqacha

- **Bot loyihasi:** `shifocrm-telegram-bot` (alohida papka, ShifoCRM dan tashqarida).
- **ShifoCRM da:** faqat `src/api/telegramApi.js` va `VITE_TELEGRAM_API_URL` + `TELEGRAM_INTEGRATION.md`.
- **Cursor ga:** yuqoridagi PROMPT blokini copy-paste qiling va ishga tushiring.
