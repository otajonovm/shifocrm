/**
 * Ilova bo'ylab qo'llaniladigan konstantlar
 * Application-wide constants
 */

// Doktorlar boshqaruvi / Doctors management
export const MAX_DOCTORS_LIMIT = 4

// UI xususiyatlari / UI Configuration
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 3000, // milliseconds
}

// UI Xabarlari / UI Messages
export const MESSAGES = {
  DOCTORS: {
    MAX_LIMIT_REACHED: `Maksimal ${MAX_DOCTORS_LIMIT} ta doktor qo'shish mumkin. Yangi doktor qo'shish uchun birontasini o'chiring.`,
    DELETE_CONFIRM: 'Ushbu doktorni o\'chirishga aminmisiz?',
    DELETE_SUCCESS: 'Doktor muvaffaqiyatli o\'chirildi',
    DELETE_ERROR: 'Doktorni o\'chirishda xatolik yuz berdi',
    CREATE_SUCCESS: 'Doktor muvaffaqiyatli qo\'shildi',
    CREATE_ERROR: 'Doktor qo\'shishda xatolik yuz berdi',
    UPDATE_SUCCESS: 'Doktor ma\'lumotlari yangilandi',
    UPDATE_ERROR: 'Doktor ma\'lumotlarini yangilashda xatolik',
    FETCH_ERROR: 'Doktorlarni yuklashda xatolik',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Login yoki parol noto\'g\'ri',
    LOGIN_FAILED: 'Tizimga kirishda xatolik',
  },
}

// Form validatsiya shablonlari / Form validation patterns
export const VALIDATION = {
  PHONE_PATTERN: '[+]?[(]?[0-9]{1,4}[)]?[-\\s./0-9]*',
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
}
