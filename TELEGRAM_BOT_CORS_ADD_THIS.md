# Telegram bot loyihasiga CORS qanday qo'shiladi

ShifoCRM Vercel (yoki boshqa domen) da ochilganda, xabar yuborish **CORS** tufayli bloklanadi. Bot serverida quyidagini qo'shing.

## 1. `cors` paketini o'rnating

```bash
npm install cors
```

## 2. Server faylida (index.js / app.js / server.js)

**Barcha route'lardan OLDIN** (masalan `app.get`, `app.post` dan oldin) quyidagini qo'shing:

```javascript
const cors = require('cors');

// Variant A: Faqat ma'lum domenlar (tavsiya)
const allowedOrigins = [
  'http://localhost:5173',
  'https://shifocrm.vercel.app',   // o'z Vercel domeningiz
  'https://your-project.vercel.app'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-KEY']
}));

// Variant B: Barcha domenlar (tez test qilish uchun; API key himoya qilsa bo'ladi)
// app.use(cors());
```

## 3. OPTIONS so'rovini qabul qilish

Agar `/api/send` faqat `POST` qilsangiz, brauzer avval `OPTIONS` (preflight) yuboradi. Express + `cors()` buni avtomatik javob beradi. Qo'lda qilsangiz:

```javascript
app.options('/api/send', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  res.sendStatus(200);
});
```

## 4. To'liq namuna (cors siz, qo'lda)

Agar `cors` paketini ishlatmasangiz, `/api/send` route'idan oldin:

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

Keyin bot ni qayta ishga tushiring yoki qayta deploy qiling. ShifoCRM (Vercel) da `VITE_TELEGRAM_API_URL` ni bot ning public HTTPS manziliga o'rnating va Redeploy qiling.
