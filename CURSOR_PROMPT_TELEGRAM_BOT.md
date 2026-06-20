# ShifoCRM ↔ Telegram Bot — Integratsiya holati va Cursor Prompt

> **Oxirgi tekshiruv:** 2026-06  
> Bot joylashuvi: `shifocrm/telegram-bot/` (loyiha ichida, lekin mustaqil Node server)  
> CRM ulanishi: `src/api/telegramApi.js` → bot `POST /api/send`

---

## Qisqa javob: to'liq integratsiya qilinganmi?

**Yo'q — taxminan 70–75% integratsiya qilingan.** Asosiy zanjir ishlaydi, lekin lead funnel, dev proxy, ba'zi completion yo'llari va xavfsizlik kamchiliklari bor.

| Holat | Qism |
|-------|------|
| ✅ To'liq | Telefon orqali `/start` → `telegram_chat_ids`; CRM dan qo'lda xabar; qabul yaratish/bekor; visit complete (visitsApi orqali); odontogram complete; treatment plan scheduler; appointment 24h/1h cron; lead callback (confirm/cancel) |
| ⚠️ Qisman | Public lead → bot redirect; hold expiry + 2h eslatma (Edge Function deploy kerak); barcha "yakunlash" yo'llari Telegram yubormaydi |
| ❌ Yo'q / buzilgan | Vite dev proxy (`/api/telegram/send`); lead deep link `?start=lead_{id}`; telefon `/start` lead bilan bog'lanmaydi; `doctors.name` xatosi eslatmalarda |

---

## Arxitektura (qanday bog'langan)

```
Vue CRM (telegramApi.js)
    │  POST /api/send, POST /api/patients/complete
    │  Header: X-API-KEY
    ▼
telegram-bot/ (Express :3001 + polling)
    │  telegramChatRepo, leadsRepo, schedulers
    ▼
Supabase (telegram_chat_ids, patients, appointments, leads, treatment_plans, scheduled_messages)
    │
    ▼
Telegram foydalanuvchilar
```

**Muhim:** CRM brauzerdan to'g'ridan-to'g'ri botga so'rov yuboradi (`VITE_TELEGRAM_API_URL`). API kalit frontend `.env` da — production uchun xavfsizlik riski.

---

## Ma'lum kamchiliklar (prioritet bo'yicha)

### P0 — Asosiy oqim buziladi
1. `DoctorLeadForm.vue` — botga `https://t.me/shifocrm_bot` ga o'tadi, **`?start=lead_{id}` yo'q** → lead `telegram_linked_at` o'rnatilmaydi → 30 daqiqada `expired`
2. `startHandler.js` — telefon orqali ro'yxatdan o'tganda **ochiq lead bog'lanmaydi** (faqat `linkLeadPatientTelegram` qiladi)
3. `vite.config.js` — dev proxy yo'q, lekin `telegramApi.js` `/api/telegram/send` kutadi → local devda xabar ketmaydi
4. `appointmentReminders.js` — `doctors.name` (bunday ustun yo'q, **`full_name`** kerak)
5. `visitsApi.js` — xuddi shu `doctor.name` xatosi

### P1 — Ishonchlilik
6. `AppointmentsView.vue` complete — `updateVisit` ishlatadi, `completeVisit` emas → visit-completed Telegram yo'q
7. `completeAllPatientVisits.js` — Telegram hook o'tkazib yuboriladi
8. `PatientMedIdCard.vue` — complete-all da Telegram yo'q
9. Edge Function `leads-cron` deploy + cron sozlanmagan bo'lsa 2 soatlik eslatma ishlamaydi
10. `TELEGRAM_BOT_URL` hardcode — env dan olish kerak (`VITE_TELEGRAM_BOT_USERNAME`)

### P2 — Sifat
11. CORS ochiq (`cors()` barcha origin)
12. Default API key `my-secret-key-12345`
13. Patient telefon qidiruvi clinic-scoped emas (multi-tenant risk)
14. `buildScheduledAt` timezone noaniq — eslatma vaqtlari siljishi mumkin
15. Hold cleanup ikki joyda: bot cron + Edge Function (duplikat)

---

## SQL migratsiyalar (bot ishlashi uchun kerak)

Supabase da ishlatilgan bo'lishi kerak:
- `telegram_chat_ids` jadvali (`telegram-bot/README.md` dagi SQL)
- `telegram-bot/migrations/002_create_scheduled_messages.sql`
- `SUPABASE_APPOINTMENTS_TABLE.sql` yoki `SUPABASE_APPOINTMENTS_BOOTSTRAP.sql`
- `SUPABASE_PHASE2_SYNC_MIGRATION.sql` (leads, appointments sync)
- `SUPABASE_CASH_SHIFTS_MIGRATION.sql` (`treatment_plans.remind_status`)

---

## Env o'zgaruvchilar

**ShifoCRM `.env`:**
```
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=...
VITE_TELEGRAM_BOT_USERNAME=shifocrm_bot
```

**telegram-bot `.env`:**
```
TELEGRAM_BOT_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
API_KEY=...   # VITE_TELEGRAM_API_KEY bilan bir xil
PORT=3001
```

---

# CURSOR PROMPT (copy-paste qiling)

Quyidagi blokni **yangi Cursor chat** ga yopishtiring. Agent `shifocrm` repo ichidagi `telegram-bot/` va bog'liq CRM fayllarini tahlil qilib, kamchiliklarni **toza JavaScript** da tuzatishi kerak.

```
Siz ShifoCRM loyihasining Telegram integratsiya mutaxassisisiz.

## Kontekst
- Monorepo: `shifocrm/` (Vue 3 CRM) + `shifocrm/telegram-bot/` (Node.js, alohida server)
- CRM → Bot: `src/api/telegramApi.js` fetch orqali `POST /api/send` va `POST /api/patients/complete`
- Bot → Supabase: service key bilan `telegram_chat_ids`, `patients`, `appointments`, `leads`, `treatment_plans`, `scheduled_messages`
- Bot entry: `telegram-bot/src/index.js`
- Faza 2 allaqachon qilingan: leads hold, `/start lead_{id}`, leadsHandler callbacks, leads-cron Edge Function

## Vazifa
Telegram bot va ShifoCRM integratsiyasini to'liq tahlil qiling va barcha P0/P1 kamchiliklarni tuzating. Faqat toza JavaScript (TypeScript yo'q). Placeholder/TODO qoldirmang.

## Avval o'qing (majburiy)
1. `telegram-bot/src/index.js`
2. `telegram-bot/src/handlers/startHandler.js`
3. `telegram-bot/src/handlers/leadsHandler.js`
4. `telegram-bot/src/repository/leadsRepo.js`
5. `telegram-bot/src/repository/telegramChatRepo.js`
6. `telegram-bot/src/services/appointmentReminders.js`
7. `telegram-bot/src/services/messageScheduler.js`
8. `telegram-bot/src/services/leadsHoldExpiry.js`
9. `src/api/telegramApi.js`
10. `src/api/visitsApi.js`
11. `src/components/public/DoctorLeadForm.vue`
12. `src/views/AppointmentsView.vue`
13. `src/lib/completePatientVisits.js`
14. `vite.config.js`
15. `.env.example` (root va telegram-bot)

## Aniq tuzatishlar (ketma-ket bajaring)

### A. Lead funnel (P0)
- [ ] `DoctorLeadForm.vue`: redirect `https://t.me/{BOT}?start=lead_{leadId}` — `VITE_TELEGRAM_BOT_USERNAME` env dan
- [ ] `startHandler.js`: telefon orqali ro'yxatdan o'tganda shu telefon/patient_id bo'yicha ochiq `leads` (status hold/new/contacted) ni topib `patient_id`, `telegram_linked_at` yangilash — `leadsRepo` dan foydalaning
- [ ] `.env.example` ga `VITE_TELEGRAM_BOT_USERNAME` qo'shing

### B. Dev integratsiya (P0)
- [ ] `vite.config.js`: proxy qo'shing
  - `/api/telegram/send` → `http://localhost:3001/api/send`
  - `/api/telegram/patients/complete` → `http://localhost:3001/api/patients/complete`
- [ ] `telegramApi.js`: `schedulePatientFollowUps` ham dev proxy ishlatishi kerak (hozir faqat send proxy bor bo'lishi mumkin — tekshiring va tuzating)

### C. Bug fixlar (P0)
- [ ] `appointmentReminders.js`: `doctors.name` → `doctors.full_name`
- [ ] `visitsApi.js` `sendVisitCompletedTelegram`: `doctor.name` → `doctor.full_name`
- [ ] `leadsHandler.js`: qabul vaqti ko'rsatishda `appointment_time` yoki `preferred_date + preferred_time` to'g'ri formatda

### D. Visit completion Telegram (P1)
- [ ] `AppointmentsView.vue`: complete flow `visitsApi.completeVisit` yoki umumiy helper orqali o'tsin (faqat `updateVisit` emas)
- [ ] `src/lib/completePatientVisits.js`: har bir yakunlangan visit uchun Telegram (yoki `completeVisit` chaqirish)
- [ ] `PatientMedIdCard.vue`: complete-all da `sendPatientCompletionSummary` yoki visitsApi hook

### E. Xavfsizlik va sifat (P1–P2)
- [ ] `telegram-bot/src/index.js`: CORS — `CORS_ORIGIN` env dan allowlist (default localhost + Vercel domain)
- [ ] `.env.example`: default `my-secret-key-12345` o'rniga placeholder + ogohlantirish
- [ ] `startHandler.js`: patient qidiruvda agar bir telefon bir necha klinikada bo'lsa, eng so'nggi lead/patient ni tanlash mantiqini qo'shing
- [ ] `src/lib/visitAppointmentSync.js` `buildScheduledAt`: Asia/Tashkent timezone yoki aniq ISO format

### F. Hujjat
- [ ] `telegram-bot/README.md` yangilang: leads handler, scheduler, leads-cron, env ro'yxati
- [ ] `TELEGRAM_INTEGRATION.md` yangilang: hozirgi arxitektura, deploy checklist, smoke test

## Qoidalar
1. Faqat JavaScript — hech qanday TypeScript
2. Bot kodi `telegram-bot/` ichida qolsin; CRM faqat `telegramApi.js` va kerakli Vue fayllarni o'zgartirsin
3. Mavjud ishlayotgan flowlarni buzmang (phone /start, /api/send, appointment reminders)
4. Har bir tuzatishdan keyin `npm run build` (CRM) va bot sintaksisini tekshiring
5. Commit faqat foydalanuvchi so'raganda

## Smoke test (o'zingiz tekshiring)
1. Lead form → redirect `?start=lead_123` → bot lead bog'laydi → `telegram_linked_at` to'ldiriladi
2. CRM dan patient detail → xabar yuborish → Telegram keladi
3. Visit complete (appointments + odontogram) → completion xabari + follow-up schedule
4. Dev: `npm run dev` + bot `npm start` → proxy orqali xabar ketadi
5. `appointmentReminders` — shifokor ismi `full_name` dan chiqadi

## Chiqish
Har bir bo'lim uchun: nima o'zgardi, qaysi fayllar, qanday test qilish — qisqa hisobot bering.
```

---

## Tezkor smoke test (o'zingiz hozir tekshiring)

```sql
-- Bemor botda ro'yxatdan o'tganmi?
SELECT * FROM telegram_chat_ids LIMIT 5;

-- Appointments eslatma uchun
SELECT id, patient_id, scheduled_at, reminder_24h_sent, reminder_1h_sent
FROM appointments WHERE scheduled_at > NOW() LIMIT 5;

-- Lead holati
SELECT id, status, patient_id, telegram_linked_at, hold_expires_at
FROM leads ORDER BY created_at DESC LIMIT 5;
```

```bash
# Terminal 1
cd telegram-bot && npm start

# Terminal 2
cd shifocrm && npm run dev

# Health
curl http://localhost:3001/health
```

---

## Keyingi qadam

1. Yuqoridagi **CURSOR PROMPT** blokini yangi chatga yopishtiring
2. Yoki menga "P0 tuzatishlarni qil" deb yozing — men to'g'ridan-to'g'ri kodda tuzataman
