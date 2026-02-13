# Environment Variables Setup / Environment O'zgaruvchilarini Sozlash

## Xato: Missing Supabase environment variables

Agar bu xatoni ko'rsangiz, `.env` fayl yo'q yoki Supabase o'zgaruvchilari to'ldirilmagan.

## Qanday Tuzatish / How to Fix

### 1. `.env` Fayl Yaratish

Loyiha ildizida (package.json bilan bir papkada) `.env` fayl yarating.

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**Windows (Command Prompt):**
```cmd
type nul > .env
```

**Mac/Linux:**
```bash
touch .env
```

### 2. `.env` Faylga Quyidagilarni Qo'shing

`.env` faylni oching va quyidagi ma'lumotlarni to'ldiring:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Telegram Bot API (ixtiyoriy)
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

### 3. Supabase Ma'lumotlarini Olish

1. [Supabase Dashboard](https://app.supabase.com) ga kiring
2. Loyihangizni tanlang
3. **Settings** > **API** ga o'ting
4. Quyidagilarni ko'rasiz:
   - **Project URL** - bu `VITE_SUPABASE_URL`
   - **anon public** key - bu `VITE_SUPABASE_ANON_KEY`

### 4. Misol

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Development Server ni Qayta Ishga Tushirish

`.env` faylni yaratgandan keyin, development server ni qayta ishga tushiring:

```bash
# Ctrl+C bilan to'xtating (agar ishlamoqda bo'lsa)
npm run dev
```

## Tekshirish / Verification

Agar hamma narsa to'g'ri bo'lsa, browser console da xato bo'lmasligi kerak.

## Xavfsizlik / Security

- ⚠️ `.env` faylni git ga commit qilmang (`.gitignore` da bor)
- ⚠️ `VITE_SUPABASE_ANON_KEY` - bu public key, lekin yaxshiroq xavfsizlik uchun hech kimga bermang
- ⚠️ **Service Role Key** ni hech qachon frontend ga qo'ymang!

## Yordam / Help

Agar muammo bo'lsa:
1. `.env` fayl loyiha ildizida ekanligini tekshiring
2. O'zgaruvchilar nomi `VITE_` bilan boshlanishini tekshiring
3. Development server ni qayta ishga tushiring
4. Browser cache ni tozalang
