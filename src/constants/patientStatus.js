/**
 * Patient Status Constants
 * Bemorlar uchun status konstantalari va konfiguratsiyasi
 */

export const PATIENT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FOLLOW_UP: 'follow_up',
  ARCHIVED: 'archived',
  DECEASED: 'deceased',
  BLOCKED: 'blocked'
}

/**
 * Status konfiguratsiyasi
 * Har bir status uchun: matn, rang, tooltip, icon
 */
import i18n from '@/i18n'

export const PATIENT_STATUS_CONFIG = {
  [PATIENT_STATUSES.ACTIVE]: {
    labelKey: 'patients.statusActive',
    descriptionKey: 'patients.statusActiveDesc',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    icon: 'check-circle',
    order: 1
  },
  [PATIENT_STATUSES.INACTIVE]: {
    labelKey: 'patients.statusInactive',
    descriptionKey: 'patients.statusInactiveDesc',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    icon: 'pause-circle',
    order: 2
  },
  [PATIENT_STATUSES.FOLLOW_UP]: {
    labelKey: 'patients.statusFollowUp',
    descriptionKey: 'patients.statusFollowUpDesc',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    icon: 'exclamation-circle',
    order: 3
  },
  [PATIENT_STATUSES.ARCHIVED]: {
    labelKey: 'patients.statusArchived',
    descriptionKey: 'patients.statusArchivedDesc',
    bgClass: 'bg-gray-200',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-400',
    icon: 'archive',
    order: 4
  },
  [PATIENT_STATUSES.DECEASED]: {
    labelKey: 'patients.statusDeceased',
    descriptionKey: 'patients.statusDeceasedDesc',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'x-circle',
    order: 5
  },
  [PATIENT_STATUSES.BLOCKED]: {
    labelKey: 'patients.statusBlocked',
    descriptionKey: 'patients.statusBlockedDesc',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-300',
    icon: 'no-symbol',
    order: 6
  }
}

/**
 * Status konfiguratsiyasini olish
 * @param {string} status - Status kodi
 * @returns {object} - Status konfiguratsiyasi
 */
export const getPatientStatusConfig = (status) => {
  const config = PATIENT_STATUS_CONFIG[status]
  if (config) {
    return {
      ...config,
      label: i18n.global.t(config.labelKey),
      description: i18n.global.t(config.descriptionKey)
    }
  }

  return {
    label: status || i18n.global.t('patients.statusUnknown'),
    description: i18n.global.t('patients.statusUnknownDesc'),
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
