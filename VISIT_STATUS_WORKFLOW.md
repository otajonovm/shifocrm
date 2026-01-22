# Tashriflar Status Workflow Tizimi
# Visit Status Workflow System

## 📋 Umumiy Ma'lumot

ShifoCRM tizimida bemorlarning har bir tashrifi (visit/appointment) uchun status workflow tizimi joriy qilingan.

## 🎯 Statuslar

### 1. **pending** - Yozildi
- **Rang:** Kulrang badge
- **Tavsif:** Onlayn yozilgan, hali klinikaga kelmagan
- **Icon:** Clock
- **Order:** 1

### 2. **arrived** - Keldi
- **Rang:** Ko'k badge
- **Tavsif:** Klinikaga keldi, navbat kutyapti
- **Icon:** Check Circle
- **Order:** 2

### 3. **in_progress** - Davolanish boshlandi
- **Rang:** Sariq badge
- **Tavsif:** Doktor qabul boshladi
- **Icon:** Play Circle
- **Order:** 3

### 4. **completed_debt** - Qarzdor
- **Rang:** Qizil badge
- **Tavsif:** Davolash tugadi, lekin bemor qarzdor
- **Icon:** Exclamation Circle
- **Order:** 4
- **Qo'shimcha:** `visit.debt_amount` maydonida qarzdorlik summasini saqlash (masalan: 220_000 so'm)

### 5. **completed_paid** - Yakunlandi
- **Rang:** Yashil badge
- **Tavsif:** Davolash va to'lov ham to'liq tugadi
- **Icon:** Check Circle
- **Order:** 5

### 6. **cancelled** - Bekor qilingan
- **Rang:** Pushti/kul badge
- **Tavsif:** Tashrif bekor qilingan
- **Icon:** X Circle
- **Order:** 6

### 7. **no_show** - Kelmagan
- **Rang:** Qizil badge
- **Tavsif:** Bemor kelmadi
- **Icon:** X Mark
- **Order:** 7

### 8. **archived** - Arxivlangan
- **Rang:** To'q kul badge
- **Tavsif:** Statistika, faqat admin uchun
- **Icon:** Archive
- **Order:** 8

## 🔄 Status O'zgarish Jarayoni

### Ruxsat Berilgan O'zgarishlar:

```
pending → arrived, cancelled, no_show
arrived → in_progress, cancelled, no_show
in_progress → completed_debt, completed_paid, cancelled
completed_debt → completed_paid (faqat qarzdorlik = 0 bo'lsa), archived
completed_paid → archived
cancelled → archived
no_show → archived
archived → (o'zgartirish mumkin emas)
```

### Muhim Qoidalar:

1. **Qarzdorlik tuzatilmasdan "completed_paid" ga o'tib ketmasin**
   - `completed_debt` dan `completed_paid` ga o'tish uchun `debt_amount` 0 yoki null bo'lishi kerak

2. **Qarzdorlik summasi**
   - `completed_debt` statusiga o'tishda `debt_amount` maydoni majburiy
   - Summa 0 dan katta bo'lishi kerak

## 💻 Implementation

### 1. Status Konstantalar

**Fayl:** `src/constants/visitStatus.js`

```javascript
import { VISIT_STATUSES, getVisitStatusConfig, getAllowedNextStatuses } from '@/constants/visitStatus'

// Status olish
const status = VISIT_STATUSES.PENDING

// Status konfiguratsiyasi
const config = getVisitStatusConfig(status)

// Keyingi ruxsat berilgan statuslar
const nextStatuses = getAllowedNextStatuses(currentStatus)
```

### 2. Badge Komponenti

**Fayl:** `src/components/ui/VisitStatusBadge.vue`

```vue
<template>
  <VisitStatusBadge 
    :status="visit.status" 
    :visit="visit" 
    :show-icon="true"
    :show-tooltip="true"
  />
</template>
```

### 3. API Funksiyalar

**Fayl:** `src/api/visitsApi.js`

```javascript
import * as visitsApi from '@/api/visitsApi'

// Yangi tashrif yaratish (default: pending)
const visit = await visitsApi.createVisit({
  patient_id: 12345,
  doctor_id: 1,
  doctor_name: 'Dr. Ahmad',
  status: 'pending', // default
  notes: 'Qo\'shimcha ma\'lumot'
})

// Status o'zgartirish
await visitsApi.updateVisit(visitId, {
  status: 'arrived'
})

// Qarzdorlik bilan yakunlash
await visitsApi.completeVisitWithDebt(visitId, 220000)

// Qarzdorlikni to'lash
await visitsApi.payDebt(visitId)

// Filtrlash
const debtVisits = await visitsApi.getDebtVisits(patientId)
```

### 4. Filtrlash

**PatientVisitsTable komponentida:**

- **Barchasi** - Barcha tashriflar
- **Aktiv** - pending, arrived, in_progress
- **Qarzdor** - completed_debt
- **Tugallangan** - completed_debt, completed_paid
- **Yozildi** - pending
- **Keldi** - arrived
- **Davolanish boshlandi** - in_progress
- **Qarzdor** - completed_debt
- **Yakunlandi** - completed_paid
- **Bekor qilingan** - cancelled
- **Kelmagan** - no_show

## 🎨 UI/UX

### Badge Ko'rinishi

- Har bir status badge ko'rinishida chiqadi
- Ranglar yuqoridagi jadvalga mos
- Badge ustiga bosilganda tooltipda status haqida qisqa matn chiqadi
- Qarzdorlik summasi badge ichida ko'rsatiladi (masalan: "Qarzdor (220,000 so'm)")

### Status O'zgartirish

- Admin va doctor visit statusini o'zgartira oladi
- Modal oyna orqali status o'zgartirish
- Qarzdorlik summasi kiritish (agar completed_debt bo'lsa)
- Validation: Qarzdorlik tuzatilmasdan "completed_paid" ga o'tib ketmasin

## 📊 Ma'lumotlar Strukturasi

### Visit Object

```javascript
{
  id: 12345,                    // 5 xonali unique ID
  patient_id: 12345,            // Bemor ID
  doctor_id: 1,                 // Doktor ID (ixtiyoriy)
  doctor_name: 'Dr. Ahmad',     // Doktor ismi
  date: '2024-01-15',           // Tashrif sanasi
  status: 'pending',            // Status
  debt_amount: null,            // Qarzdorlik summasi (so'm)
  service_name: 'Konsultatsiya', // Xizmat nomi (ixtiyoriy)
  notes: 'Qo\'shimcha ma\'lumot', // Izohlar
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}
```

## 🔐 Ruxsatlar

- **Admin:** Barcha tashriflarni ko'rish va o'zgartirish
- **Doctor:** Faqat o'z bemorlarining tashriflarini ko'rish va o'zgartirish

## 📝 Misollar

### 1. Yangi Tashrif Yaratish

```javascript
const newVisit = await visitsApi.createVisit({
  patient_id: 12345,
  doctor_id: 1,
  doctor_name: 'Dr. Ahmad',
  status: 'pending', // Onlayn yozilgan
  notes: 'Bemor onlayn yozildi'
})
```

### 2. Bemor Keldi

```javascript
await visitsApi.updateVisit(visitId, {
  status: 'arrived'
})
```

### 3. Davolanish Boshlandi

```javascript
await visitsApi.updateVisit(visitId, {
  status: 'in_progress'
})
```

### 4. Qarzdorlik Bilan Yakunlash

```javascript
await visitsApi.completeVisitWithDebt(visitId, 220000)
// yoki
await visitsApi.updateVisit(visitId, {
  status: 'completed_debt',
  debt_amount: 220000
})
```

### 5. Qarzdorlikni To'lash

```javascript
await visitsApi.payDebt(visitId)
// yoki
await visitsApi.updateVisit(visitId, {
  status: 'completed_paid',
  debt_amount: null
})
```

### 6. Filtrlash

```javascript
// Qarzdor tashriflar
const debtVisits = await visitsApi.getDebtVisits(patientId)

// Status bo'yicha filtrlash
const filtered = visitsApi.filterVisitsByStatus(visits, 'completed_paid')
// yoki
const filtered = visitsApi.filterVisitsByStatus(visits, ['completed_debt', 'completed_paid'])
```

## 🐛 Xatoliklar va Yechimlar

### 1. "Qarzdorlik tuzatilmasdan 'completed_paid' ga o'tib ketmasin"

**Muammo:** `completed_debt` dan `completed_paid` ga o'tishda qarzdorlik 0 emas

**Yechim:** Avval qarzdorlikni to'lash kerak (`debt_amount = null` yoki `payDebt()`)

### 2. "Qarzdorlik summasi kiritilishi kerak"

**Muammo:** `completed_debt` statusiga o'tishda `debt_amount` kiritilmagan

**Yechim:** `debt_amount` maydonini to'ldirish kerak (0 dan katta)

## 📚 Qo'shimcha Ma'lumot

- **Konstantalar:** `src/constants/visitStatus.js`
- **Badge Komponenti:** `src/components/ui/VisitStatusBadge.vue`
- **API:** `src/api/visitsApi.js`
- **Table Komponenti:** `src/components/patients/PatientVisitsTable.vue`

---

**Oxirgi Yangilanish:** 2024  
**Versiya:** 1.0
