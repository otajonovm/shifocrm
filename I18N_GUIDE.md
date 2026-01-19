# 🌍 Ko'p Tillilik Qo'llanmasi / Internationalization Guide

## 📋 Umumiy Ma'lumot

Loyiha endi **O'zbek** va **Rus** tillarini qo'llab-quvvatlaydi. Til o'zgarishi localStorage'da saqlanadi va sahifa yangilanganda ham saqlanib qoladi.

## 🚀 Qo'shilgan Funksiyalar

### 1. **vue-i18n** Kutubxonasi
- Vue 3 uchun i18n kutubxonasi o'rnatildi
- Composition API bilan ishlaydi

### 2. **Til Fayllari**
- `src/i18n/locales/uz.json` - O'zbek tili
- `src/i18n/locales/ru.json` - Rus tili

### 3. **Til O'zgartirish Komponenti**
- `src/components/shared/LanguageSwitcher.vue` - Til o'zgartirish tugmasi
- MainLayout'da header'da joylashgan

### 4. **i18n Store**
- `src/stores/i18n.js` - Til boshqaruvi uchun Pinia store

## 📖 Qanday Ishlatish

### Komponentlarda Tarjimalarni Ishlatish

#### Option 1: Template'da `$t()` funksiyasi
```vue
<template>
  <h1>{{ $t('patients.title') }}</h1>
  <button>{{ $t('common.save') }}</button>
</template>
```

#### Option 2: Script'da `useI18n()` composable
```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const title = computed(() => t('patients.title'))
</script>
```

#### Option 3: Computed property'da
```vue
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pageTitle = computed(() => t('dashboard.title'))
</script>
```

### Til O'zgartirish

#### Store orqali:
```javascript
import { useI18nStore } from '@/stores/i18n'

const i18nStore = useI18nStore()

// Til o'zgartirish
i18nStore.setLocale('ru') // Rus tiliga
i18nStore.setLocale('uz') // O'zbek tiliga

// Til almashtirish (toggle)
i18nStore.toggleLocale()
```

#### Yoki to'g'ridan-to'g'ri:
```javascript
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
locale.value = 'ru' // Rus tiliga
locale.value = 'uz' // O'zbek tiliga
```

## 📝 Tarjima Kalitlari (Keys)

### Umumiy (common)
- `common.save` - Saqlash
- `common.cancel` - Bekor qilish
- `common.delete` - O'chirish
- `common.edit` - Tahrirlash
- `common.search` - Qidirish
- `common.loading` - Yuklanmoqda...
- `common.status` - Status
- `common.active` - Faol
- `common.inactive` - Nofaol

### Bemorlar (patients)
- `patients.title` - Bemorlar
- `patients.allPatients` - Barcha Bemorlar
- `patients.myPatients` - Mening Bemorlarim
- `patients.addPatient` - Yangi Bemor
- `patients.fullName` - F.I.O
- `patients.phone` - Telefon
- `patients.visits` - Tashriflar
- `patients.odontogram` - Odontogramma
- `patients.payments` - To'lovlar
- `patients.documents` - Hujjatlar

### Doktorlar (doctors)
- `doctors.title` - Doktorlar
- `doctors.addDoctor` - Yangi Doktor
- `doctors.manageDoctors` - Doktorlarni Boshqarish

### Dashboard
- `dashboard.title` - Dashboard
- `dashboard.overview` - Umumiy ko'rsatkichlar
- `dashboard.welcome` - Xush kelibsiz

### Xatoliklar (errors)
- `errors.required` - Majburiy maydon
- `errors.saveError` - Saqlashda xatolik
- `errors.loadError` - Yuklashda xatolik

### Muvaffaqiyat (success)
- `success.saved` - Muvaffaqiyatli saqlandi
- `success.deleted` - Muvaffaqiyatli o'chirildi

## 🔧 Yangi Tarjima Qo'shish

### 1. `uz.json` fayliga qo'shing:
```json
{
  "mySection": {
    "myKey": "O'zbekcha matn"
  }
}
```

### 2. `ru.json` fayliga qo'shing:
```json
{
  "mySection": {
    "myKey": "Русский текст"
  }
}
```

### 3. Komponentda ishlating:
```vue
<template>
  <p>{{ $t('mySection.myKey') }}</p>
</template>
```

## 📍 Hozirgi Holat

### ✅ Tarjima Qilingan Komponentlar:
- ✅ MainLayout (header, sidebar)
- ✅ PatientsView (asosiy qismlar)
- ✅ PatientDetailView (profil header, tabs)

### ⏳ Keyingi Qadamlar:
- Barcha view komponentlarida tarjimalarni qo'shish
- Form validation xabarlarini tarjima qilish
- Toast notification xabarlarini tarjima qilish
- Error message'larni tarjima qilish

## 💡 Maslahatlar

1. **Kalit nomlarini aniq qiling** - `patients.addPatient` yaxshi, `add` yomon
2. **Kategoriyalarga ajrating** - `common`, `patients`, `doctors` kabi
3. **Parametrli tarjimalar** - `{name} ni o'chirmoqchimisiz?` kabi
4. **Pluralization** - Ko'plik shakllarini hisobga oling

## 🔄 Til O'zgartirish Tugmasi

Header'da o'ng tomonda til o'zgartirish tugmasi mavjud:
- 🇺🇿 O'zbek
- 🇷🇺 Русский

Tugmani bosib, kerakli tilni tanlang. Tanlangan til avtomatik saqlanadi.
