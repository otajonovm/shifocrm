/**
 * Patient Status Constants
 * Bemorlar uchun status konstantalari va konfiguratsiyasi
 */

export const PATIENT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DECEASED: 'deceased'
}

/**
 * Status konfiguratsiyasi
 * Har bir status uchun: matn, rang, tooltip, icon
 */
export const PATIENT_STATUS_CONFIG = {
  [PATIENT_STATUSES.ACTIVE]: {
    label: 'Faol',
    description: 'Bemor faol, davolanish jarayonida',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    icon: 'check-circle',
    order: 1
  },
  [PATIENT_STATUSES.INACTIVE]: {
    label: 'Nofaol',
    description: 'Bemor nofaol holatda',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    icon: 'pause-circle',
    order: 2
  },
  [PATIENT_STATUSES.ARCHIVED]: {
    label: 'Arxivlangan',
    description: 'Bemor arxivga olingan',
    bgClass: 'bg-gray-200',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-400',
    icon: 'archive',
    order: 3
  },
  [PATIENT_STATUSES.DECEASED]: {
    label: 'Vafot etgan',
    description: 'Bemor vafot etgan',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'x-circle',
    order: 4
  }
}

/**
 * Status konfiguratsiyasini olish
 * @param {string} status - Status kodi
 * @returns {object} - Status konfiguratsiyasi
 */
export const getPatientStatusConfig = (status) => {
  return PATIENT_STATUS_CONFIG[status] || {
    label: status || 'Noma\'lum',
    description: 'Status noma\'lum',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    icon: 'question-mark',
    order: 999
  }
}

/**
 * Status matnini olish
 * @param {string} status - Status kodi
 * @returns {string} - Status matni
 */
export const getPatientStatusLabel = (status) => {
  return getPatientStatusConfig(status).label
}

/**
 * Status ranglarini olish
 * @param {string} status - Status kodi
 * @returns {object} - { bgClass, textClass, borderClass }
 */
export const getPatientStatusColors = (status) => {
  const config = getPatientStatusConfig(status)
  return {
    bgClass: config.bgClass,
    textClass: config.textClass,
    borderClass: config.borderClass
  }
}
