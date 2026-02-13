# ShifoCRM Telegram Bot Integratsiya

Bu hujjat ShifoCRM loyihasini Telegram bot bilan bog'lash uchun to'liq yo'riqnoma.

## Struktura

- **Bot loyihasi:** `../ShifoCRM_bot/` (alohida repo/papka)
- **ShifoCRM:** `shifocrm/` (asosiy loyiha)

Bot loyihasi ShifoCRM kodiga bog'liq emas va mustaqil ishlaydi.

## 1. Botni ishga tushirish

1. `ShifoCRM_bot/` papkasiga kiring
2. `npm install`
3. `.env` faylni to'ldiring (qarang: `README.md`)
4. Supabase SQL Editor'da `migrations/001_create_telegram_chat_ids.sql` ni ishga tushiring
5. `npm start` yoki `npm run dev`

## 2. ShifoCRM integratsiya

### 2.1 API client

`src/api/telegramApi.js` fayli allaqachon yaratilgan. U quyidagi funksiyalarni ta'minlaydi:

- `sendTelegramNotification({ patientId, message })` - Oddiy xabar yuborish
- `sendAppointmentReminder({ patientId, appointmentDate, doctorName })` - Qabul eslatmasi
- `sendDebtReminder({ patientId, amount, dueDate })` - Qarz eslatmasi
- `sendAppointmentConfirmed({ patientId, appointmentDate, doctorName })` - Qabul tasdiqlandi
- `sendAppointmentCanceled({ patientId, reason })` - Qabul bekor qilindi

### 2.2 Environment variables

`.env` faylga quyidagilarni qo'shing:

```env
# Telegram Bot API
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

**Production uchun:**
```env
VITE_TELEGRAM_API_URL=https://your-bot-domain.com
VITE_TELEGRAM_API_KEY=your-api-key
```

### 2.3 Ishlatish misollari

#### Qabul yaratilganda eslatma yuborish

```javascript
import { sendAppointmentReminder } from '@/api/telegramApi';

// Qabul yaratilganda
await sendAppointmentReminder({
  patientId: patient.id.toString(),
  appointmentDate: '2024-01-25 15:00',
  doctorName: 'Dr. Ahmadov',
});
```

#### Qabul tasdiqlanganda

```javascript
import { sendAppointmentConfirmed } from '@/api/telegramApi';

await sendAppointmentConfirmed({
  patientId: patient.id.toString(),
  appointmentDate: appointment.date,
  doctorName: doctor.name,
});
```

#### Qarz eslatmasi

```javascript
import { sendDebtReminder } from '@/api/telegramApi';

await sendDebtReminder({
  patientId: patient.id.toString(),
  amount: debtAmount,
  dueDate: '2024-01-30',
});
```

#### Oddiy xabar

```javascript
import { sendTelegramNotification } from '@/api/telegramApi';

await sendTelegramNotification({
  patientId: patient.id.toString(),
  message: 'Qabulingiz tasdiqlandi ✅',
});
```

### 2.4 VisitsApi yoki boshqa joylarda integratsiya

Masalan, `src/api/visitsApi.js` yoki qabul yaratish funksiyasida:

```javascript
import { sendAppointmentReminder } from '@/api/telegramApi';

export const createAppointment = async (appointmentData) => {
  // ... qabul yaratish logikasi
  const appointment = await supabasePost('appointments', appointmentData);
  
  // Telegram xabar yuborish
  if (appointment && appointment.patient_id) {
    await sendAppointmentReminder({
      patientId: appointment.patient_id.toString(),
      appointmentDate: appointment.date,
      doctorName: appointment.doctor_name,
    }).catch(err => {
      console.warn('Telegram xabar yuborilmadi:', err);
      // Xatolik bo'lsa ham qabul yaratiladi
    });
  }
  
  return appointment;
};
```

## 3. Xavfsizlik

Production uchun:
1. Bot'da `BOT_API_KEY` ni qo'shing
2. ShifoCRM'da `VITE_TELEGRAM_API_KEY` ni qo'shing
3. HTTPS ishlating
4. Bot server'ni deploy qiling (Vercel, Railway, Render)

## 4. Xatoliklar

- `CHAT_ID_NOT_FOUND` - Patient bot'da ro'yxatdan o'tmagan. Patient'ga `/register` buyrug'ini yuborish kerak.
- `NOT_CONFIGURED` - `VITE_TELEGRAM_API_URL` sozlanmagan.
- `UNAUTHORIZED` - API key noto'g'ri.

## 5. Test qilish

1. Bot'ni ishga tushiring (`ShifoCRM_bot/` papkasida `npm start`)
2. Test patient bilan Telegram bot'da `/register` qiling
3. ShifoCRM'dan xabar yuborib ko'ring

## 6. Patient ID format

ShifoCRM'da patient ID raqam (integer) bo'lishi mumkin. Telegram bot'ga yuborishda `.toString()` qiling:

```javascript
patientId: patient.id.toString()
```

## 7. Deploy

### Bot server deploy

1. Bot'ni Vercel/Railway/Render'ga deploy qiling
2. Environment variables'ni qo'shing
3. Bot URL'ni oling va ShifoCRM `.env` ga qo'shing

### ShifoCRM deploy

1. `.env` dagi `VITE_TELEGRAM_API_URL` ni production URL bilan almashtiring
2. Build qiling va deploy qiling
