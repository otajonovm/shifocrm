# Database Setup Guide / Database Sozlash Qo'llanmasi

## Supabase Database Schema / Supabase Database Schema

### 1. Doctors Table Yangilash / Update Doctors Table

Supabase SQL Editor da quyidagi SQL kodlarni ishga tushiring:

```sql
-- Email ustuni qo'shish
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Specialization ustuni qo'shish
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);

-- Experience years ustuni qo'shish (ixtiyoriy)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Email uchun index yaratish
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

-- Email ni NOT NULL qilish (agar kerak bo'lsa)
-- ALTER TABLE doctors ALTER COLUMN email SET NOT NULL;
```

### 2. Row Level Security (RLS) Sozlash

```sql
-- RLS ni yoqish
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Doktorlar faqat o'z profilini ko'rishi
CREATE POLICY "Doctors can view own profile"
ON doctors FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Doktorlar faqat o'z profilini yangilashi
CREATE POLICY "Doctors can update own profile"
ON doctors FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin barcha doktorlarni ko'rishi (agar kerak bo'lsa)
-- Bu policy ni faqat admin authentication qo'shgandan keyin qo'shing
-- CREATE POLICY "Admin can view all doctors"
-- ON doctors FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND auth.users.raw_user_meta_data->>'role' = 'admin'
--   )
-- );
```

### 3. Supabase Auth Sozlash

1. Supabase Dashboard ga kiring
2. Authentication > Settings ga o'ting
3. Email authentication yoqilganligini tekshiring
4. Email confirmation ni sozlang (development uchun o'chirib qo'yishingiz mumkin)

### 4. Doctor Yaratish (Edge Function)

**MUHIM:** Doctor yaratishda Supabase Auth user yaratish kerak. Buning uchun 2 ta variant bor:

#### Variant 1: Supabase Edge Function (Tavsiya etiladi)

`supabase/functions/create-doctor/index.ts` faylini yarating:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { full_name, phone, email, password, is_active, specialization } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create doctor record
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .insert([{
        id: authData.user.id,
        full_name,
        phone,
        email,
        is_active,
        specialization,
      }])
      .select()
      .single()

    if (error) {
      // If doctor creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(data), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

Keyin `src/api/doctorsApi.js` da:

```javascript
export const createDoctor = async (doctorData) => {
  const { data, error } = await supabase.functions.invoke('create-doctor', {
    body: doctorData
  })

  if (error) throw error
  return data
}
```

#### Variant 2: Backend API (Agar backend bo'lsa)

Backend API endpoint yarating va u yerda service role key ishlating.

### 5. Environment Variables

`.env` fayl yarating (`.env.example` dan nusxa oling):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**MUHIM:** Service role key ni hech qachon frontend ga qo'ymang!

---

## Test Qilish / Testing

1. Database migration larni ishga tushiring
2. RLS policies ni tekshiring
3. Doctor yaratishni test qiling
4. Doctor login ni test qiling
5. Doctor profile ni test qiling

---

## Xatoliklar / Troubleshooting

### "Email already exists"
- Email unique bo'lishi kerak
- Oldingi test ma'lumotlarini o'chiring

### "Doctor profile not found"
- Auth user ID va doctor ID mos kelishi kerak
- Doctor yaratishda ID ni to'g'ri qo'yganingizni tekshiring

### "RLS policy violation"
- RLS policies to'g'ri sozlanganligini tekshiring
- Auth user authenticated ekanligini tekshiring
