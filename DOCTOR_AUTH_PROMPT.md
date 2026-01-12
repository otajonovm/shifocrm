# Doktorlar uchun Shaxsiy Profil Tizimi - AI Prompt
# Doctor Personal Profile System - AI Implementation Guide

## O'zbek tilda / In Uzbek

### Vazifa Tavsifi

Hozirda loyihada:
- ✅ Admin tizimga kiradi (login/parol)
- ✅ Admin doktorlar qo'shadi, tahrirlaydi, o'chiradi

Qo'shilishi kerak:
- ❌ Har bir doktor o'zining login va paroliga ega bo'lishi
- ❌ Doktorlar o'z shaxsiy profillariga kirishi
- ❌ Doktor faqat o'z ma'lumotlarini ko'rishi va tahrirlashi

---

## Cursor AI uchun Prompt / Prompt for Cursor AI

```
Iltimos, quyidagi funksiyani amalga oshiring:

## Maqsad
ShifoApp CRM loyihasiga doktorlar uchun authentication va shaxsiy profil tizimini qo'shing.

## Hozirgi Holat
- Admin tizimga kiradi (auth.js store orqali)
- Admin doktorlarni boshqaradi (doctors table da)
- Faqat admin rolidan foydalaniladi

## Kerakli O'zgarishlar

### 1. Database Schema (Supabase)
Doctors jadvaliga quyidagi ustunlarni qo'shing:
- `email` VARCHAR(100) UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL (Supabase Auth orqali boshqariladi)
- `specialization` VARCHAR(100) (Mutaxassislik: Terapevt, Kardiolog, va h.k.)
- `experience_years` INTEGER (Tajriba yillari)
- `working_hours` JSONB (Ish vaqti: {"monday": "9:00-17:00", ...})

### 2. Authentication System

#### 2.1. Auth Store ni Kengaytirish (src/stores/auth.js)
```javascript
// Yangi state qo'shing:
const userId = ref(localStorage.getItem('userId') || null)
const userEmail = ref(localStorage.getItem('userEmail') || null)

// Yangi login funksiyasi:
const loginDoctor = async ({ email, password }) => {
  // Supabase Auth ishlatish
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Doctor ma'lumotlarini olish
  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', email)
    .single()
  
  // State yangilash
  isAuthenticated.value = true
  userRole.value = 'doctor'
  userId.value = doctor.id
  userEmail.value = email
  
  // LocalStorage ga saqlash
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('userRole', 'doctor')
  localStorage.setItem('userId', doctor.id)
  localStorage.setItem('userEmail', email)
  
  return { success: true, user: doctor }
}
```

#### 2.2. Login Sahifasini Yangilash (src/views/LoginView.vue)
- Ikki xil login form yarating:
  1. Admin login (login/parol)
  2. Doktor login (email/parol)
- Tab yoki toggle button orqali almashtirish

### 3. Doktor Profil Sahifasi

#### 3.1. Yangi View Yaratish (src/views/DoctorProfileView.vue)
```vue
<template>
  <div class="doctor-profile">
    <h1>Mening Profilim</h1>
    
    <!-- Shaxsiy Ma'lumotlar -->
    <section>
      <h2>Shaxsiy Ma'lumotlar</h2>
      <form @submit.prevent="updateProfile">
        <input v-model="profile.full_name" placeholder="To'liq ism" />
        <input v-model="profile.phone" placeholder="Telefon" />
        <input v-model="profile.email" type="email" placeholder="Email" disabled />
        <input v-model="profile.specialization" placeholder="Mutaxassislik" />
        <input v-model="profile.experience_years" type="number" placeholder="Tajriba (yil)" />
        
        <button type="submit">Saqlash</button>
      </form>
    </section>
    
    <!-- Ish Vaqti -->
    <section>
      <h2>Ish Vaqti</h2>
      <!-- Working hours editor -->
    </section>
    
    <!-- Parolni O'zgartirish -->
    <section>
      <h2>Parolni O'zgartirish</h2>
      <form @submit.prevent="changePassword">
        <input v-model="oldPassword" type="password" placeholder="Joriy parol" />
        <input v-model="newPassword" type="password" placeholder="Yangi parol" />
        <input v-model="confirmPassword" type="password" placeholder="Parolni tasdiqlang" />
        <button type="submit">Parolni Yangilash</button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'

const authStore = useAuthStore()
const profile = ref({})

onMounted(async () => {
  // Faqat o'z profilini olish
  const { data } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', authStore.userId)
    .single()
  
  profile.value = data
})

const updateProfile = async () => {
  const { error } = await supabase
    .from('doctors')
    .update({
      full_name: profile.value.full_name,
      phone: profile.value.phone,
      specialization: profile.value.specialization,
      experience_years: profile.value.experience_years,
    })
    .eq('id', authStore.userId)
  
  if (!error) {
    // Success notification
  }
}

const changePassword = async () => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword.value
  })
  
  if (!error) {
    // Success notification
  }
}
</script>
```

### 4. Router ga Yangi Route Qo'shing (src/router/index.js)
```javascript
{
  path: '/doctor/profile',
  name: 'doctor-profile',
  component: () => import('@/views/DoctorProfileView.vue'),
  meta: { requiresAuth: true, requiresRole: 'doctor' }
}
```

### 5. Admin: Doktor Yaratishda Email va Parol

#### 5.1. DoctorsView ni Yangilash (src/views/DoctorsView.vue)
Doktor qo'shish formiga qo'shing:
```vue
<input 
  v-model="form.email" 
  type="email" 
  required 
  placeholder="Email (login uchun)"
/>
<input 
  v-model="form.password" 
  type="password" 
  required 
  placeholder="Boshlang'ich parol"
/>
<input 
  v-model="form.specialization" 
  placeholder="Mutaxassislik"
/>
```

#### 5.2. Create Funksiyasini Yangilash (src/api/doctorsApi.js)
```javascript
export const createDoctor = async (doctorData) => {
  // 1. Supabase Auth da foydalanuvchi yaratish
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: doctorData.email,
    password: doctorData.password,
    email_confirm: true
  })
  
  if (authError) throw authError
  
  // 2. Doctors jadvaliga qo'shish
  const { data, error } = await supabase
    .from('doctors')
    .insert([{
      id: authData.user.id, // Auth user ID
      full_name: doctorData.full_name,
      phone: doctorData.phone,
      email: doctorData.email,
      specialization: doctorData.specialization,
      is_active: doctorData.is_active
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

### 6. Dashboard ga Role-based Content

#### 6.1. DashboardView ni Yangilash (src/views/DashboardView.vue)
```vue
<template>
  <div>
    <!-- Admin Dashboard -->
    <div v-if="authStore.userRole === 'admin'">
      <router-link to="/doctors">Doktorlar Boshqaruvi</router-link>
      <!-- Admin kartalar -->
    </div>
    
    <!-- Doctor Dashboard -->
    <div v-if="authStore.userRole === 'doctor'">
      <router-link to="/doctor/profile">Mening Profilim</router-link>
      <!-- Doktor kartalar: Bugungi qabullar, Bemorlar, va h.k. -->
    </div>
  </div>
</template>
```

### 7. Supabase Row Level Security (RLS)

Supabase SQL Editor da ishga tushiring:
```sql
-- Doctors jadvalini himoya qilish
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Admin barcha doktorlarni ko'rishi mumkin
CREATE POLICY "Admin can view all doctors"
ON doctors FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM admin_users) -- Admin users table
);

-- Doktor faqat o'z ma'lumotlarini ko'rishi
CREATE POLICY "Doctors can view own profile"
ON doctors FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Doktor faqat o'z profilini yangilashi
CREATE POLICY "Doctors can update own profile"
ON doctors FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 8. Qo'shimcha Xususiyatlar (Ixtiyoriy)

- Doktor login tarixini tracking
- Parol reset funksiyasi (email orqali)
- 2-factor authentication
- Session timeout
- Profile rasm yuklash

## Amalga Oshirish Tartibi

1. **Birinchi:** Database schema yangilash (email, password ustunlari)
2. **Ikkinchi:** Auth store kengaytirish (doctor login)
3. **Uchinchi:** Login sahifasini yangilash (ikki xil login)
4. **To'rtinchi:** Doctor profile sahifasi yaratish
5. **Beshinchi:** Admin doctor yaratishda email/parol qo'shish
6. **Oltinchi:** Router va dashboard yangilash
7. **Ettinchi:** Supabase RLS sozlash

## Xavfsizlik

⚠️ **Muhim:**
- Hech qachon parollarni plaintext saqlamang
- Supabase Auth dan foydalaning (password hashing avtomatik)
- RLS policies to'g'ri sozlang
- JWT token lar ishlatiladi
- Session timeout qo'ying (30 daqiqa)

## Test Qilish

1. Admin login ✅
2. Admin doktor yaratishi ✅
3. Doktor email/parol olishi ✅
4. Doktor login qilishi ✅
5. Doktor faqat o'z profilini ko'rishi ✅
6. Doktor o'z ma'lumotlarini yangilashi ✅
7. Doktor parolini o'zgartirishi ✅
8. Doktor boshqa doktorlarni ko'ra olmasligi ✅
```

---

## English Translation

```
Please implement the following functionality:

## Goal
Add authentication and personal profile system for doctors in ShifoApp CRM.

## Current State
- Admin logs in (via auth.js store)
- Admin manages doctors (in doctors table)
- Only admin role is used

## Required Changes

### 1. Database Schema (Supabase)
Add these columns to doctors table:
- `email` VARCHAR(100) UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL (managed via Supabase Auth)
- `specialization` VARCHAR(100) (Specialty: Therapist, Cardiologist, etc.)
- `experience_years` INTEGER
- `working_hours` JSONB (Schedule: {"monday": "9:00-17:00", ...})

### 2. Authentication System

#### 2.1. Extend Auth Store (src/stores/auth.js)
Add doctor login function using Supabase Auth

#### 2.2. Update Login Page (src/views/LoginView.vue)
Create two login forms:
1. Admin login (username/password)
2. Doctor login (email/password)

### 3. Doctor Profile Page

Create new view: src/views/DoctorProfileView.vue
- Personal information section
- Working hours editor
- Password change form

### 4. Update Router (src/router/index.js)
Add route for doctor profile with role guard

### 5. Admin: Add Email and Password When Creating Doctor

Update DoctorsView form to include:
- Email field
- Initial password field
- Specialization field

Update createDoctor API to:
1. Create user in Supabase Auth
2. Insert doctor record with auth user ID

### 6. Role-based Dashboard Content

Update DashboardView to show different content for:
- Admin: Manage doctors, patients, appointments
- Doctor: View own profile, today's appointments

### 7. Supabase Row Level Security (RLS)

Enable RLS policies:
- Admin can view all doctors
- Doctors can only view/update own profile

### 8. Implementation Order

1. Update database schema
2. Extend auth store
3. Update login page
4. Create doctor profile page
5. Update admin doctor creation
6. Update router and dashboard
7. Configure Supabase RLS

## Security Notes

⚠️ Important:
- Never store passwords in plaintext
- Use Supabase Auth (automatic password hashing)
- Configure RLS policies correctly
- Use JWT tokens
- Set session timeout (30 minutes)
```

---

## Qisqa Versiya / Short Version for Quick Implementation

```
Tezkor amalga oshirish uchun:

1. Doctors jadvaliga email ustuni qo'shing
2. Supabase Auth dan foydalaning (password uchun)
3. LoginView da doctor/admin toggle qo'shing
4. DoctorProfileView.vue yarating
5. Router da /doctor/profile route qo'shing
6. Admin doktor yaratishda email va parol qo'shing
7. RLS policies sozlang

Bu 4-6 soatlik ish.
```

---

## Yordam va Qo'shimcha Ma'lumotlar

- Supabase Auth docs: https://supabase.com/docs/guides/auth
- Vue Router guards: https://router.vuejs.org/guide/advanced/navigation-guards.html
- Pinia stores: https://pinia.vuejs.org/

## Savol-Javob

**S:** Parolni qanday saqlash kerak?
**J:** Supabase Auth avtomatik hash qiladi, siz plaintext parolni hech qachon saqlamaysiz.

**S:** Admin va Doctor bir vaqtda login qila oladimi?
**J:** Ha, lekin ular turli role larga ega.

**S:** Doktor o'z parolini reset qila oladimi?
**J:** Ha, Supabase Auth reset password funksiyasi mavjud.
