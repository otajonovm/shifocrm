# ShifoCRM - O'rnatish va Muammolarni Hal Qilish

## 404 Xatosini Hal Qilish

Agar loyiha ishga tushmasa va "404" yoki "Failed to load resource" xatosi ko'rsatilsa, quyidagi qadamlarni bajaring:

### Muammo Sababi

Loyiha Supabase backend bilan ishlaydi va environment variables (muhit o'zgaruvchilari) talab qilinadi. Agar `.env` fayli mavjud bo'lmasa yoki to'g'ri to'ldirilmagan bo'lsa, loyiha ishlamaydi.

### Yechim: Qadam-baqadam Ko'rsatma

#### 1. Supabase Account Yaratish

Agar Supabase accountingiz yo'q bo'lsa:

1. [https://supabase.com](https://supabase.com) saytiga o'ting
2. "Start your project" tugmasini bosing
3. GitHub yoki email orqali ro'yxatdan o'ting
4. Yangi project yarating

#### 2. Supabase Ma'lumotlarini Olish

Supabase dashboard'da:

1. **Project Settings** (Sozlamalar) ga o'ting
2. **API** bo'limini tanlang
3. Quyidagi ma'lumotlarni ko'chirib oling:
   - **Project URL** (Loyiha URL)
   - **anon/public key** (Anonim/ommaviy kalit)

#### 3. Environment Faylini Yaratish

Loyiha papkasida (shifocrm):

```bash
# .env.example faylini .env ga nusxalash
cp .env.example .env
```

Yoki qo'lda `.env` faylini yarating va quyidagi ma'lumotlarni kiriting:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Muhim:** `your-project-id` va `your-anon-key-here` ni o'z Supabase ma'lumotlaringiz bilan almashtiring!

#### 4. Database Jadvalni Yaratish

Supabase SQL Editor'da quyidagi SQL kodni ishga tushiring:

```sql
-- Doctors jadvali yaratish
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security) yoqish
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Barcha operatsiyalar uchun policy yaratish (development uchun)
CREATE POLICY "Enable all operations for all users" ON doctors
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**Eslatma:** Bu development uchun oddiy policy. Production uchun xavfsizroq policy yarating!

#### 5. Loyihani Qayta Ishga Tushirish

Terminal'da:

```bash
# Dependencies o'rnatish (agar o'rnatilmagan bo'lsa)
npm install

# Development server ishga tushirish
npm run dev
```

Endi brauzerda `http://localhost:5173` ochilishi kerak va loyiha ishlaydi! ✅

---

## Tez-tez Uchraydigan Muammolar

### 1. "Missing Supabase environment variables" Xatosi

**Sabab:** `.env` fayli mavjud emas yoki bo'sh.

**Yechim:** Yuqoridagi 3-qadamni bajaring va `.env` faylini to'g'ri to'ldiring.

### 2. "Failed to fetch doctors" Xatosi

**Sabab:** Database'da `doctors` jadvali mavjud emas.

**Yechim:** Yuqoridagi 4-qadamni bajaring va SQL kodni ishga tushiring.

### 3. "CORS" yoki "Network" Xatosi

**Sabab:** Supabase URL yoki API key noto'g'ri.

**Yechim:** `.env` faylini tekshiring va ma'lumotlarni to'g'ri ko'chiring. Probel yoki qo'shimcha belgilar bo'lmasligi kerak.

### 4. Login Ishlamayapti

**Sabab:** Bu oddiy local authentication. Supabase Auth bilan bog'liq emas.

**Yechim:** 
- Login: `admin`
- Parol: `admin123`

Bu ma'lumotlar `db.json` faylida saqlangan.

---

## Production Uchun Xavfsizlik

⚠️ **MUHIM:** Production muhitda quyidagilarni amalga oshiring:

1. **Environment Variables:** `.env` faylini git'ga commitlamang
2. **RLS Policies:** Database uchun to'g'ri xavfsizlik qoidalarini yozing
3. **Authentication:** `db.json` o'rniga Supabase Auth yoki boshqa xavfsiz tizimdan foydalaning
4. **HTTPS:** Faqat HTTPS orqali ishlating
5. **API Keys:** Anon key'ni faqat client-side uchun ishlating, hech qachon service_role key'ni client'da ishlatmang

---

## Qo'shimcha Yordam

Agar muammo hal bo'lmasa:

1. Browser console'ni oching (F12) va xatolarni tekshiring
2. Terminal'dagi xatolarni o'qing
3. `.env` faylida barcha ma'lumotlar to'g'riligini tekshiring
4. Node.js versiyasini tekshiring: `node --version` (20.19.0+ yoki 22.12.0+ bo'lishi kerak)

---

## Muvaffaqiyatli O'rnatish Belgisi

Agar hammasi to'g'ri o'rnatilgan bo'lsa:

1. ✅ Browser'da login sahifasi ochiladi
2. ✅ Console'da xatolar yo'q
3. ✅ `admin` / `admin123` bilan kirish mumkin
4. ✅ Dashboard sahifasi ochiladi
5. ✅ Doctors sahifasida shifokorlar ro'yxati ko'rinadi (bo'sh bo'lishi mumkin)

**Omad tilaymiz!** 🎉
