/**
 * Visit Status Constants
 * Tashriflar uchun status konstantalari va konfiguratsiyasi
 */
import i18n from '@/i18n'

export const VISIT_STATUSES = {
  PENDING: 'pending',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED_DEBT: 'completed_debt',
  COMPLETED_PAID: 'completed_paid',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  ARCHIVED: 'archived'
}

/**
 * Status konfiguratsiyasi
 * Har bir status uchun: matn, rang, tooltip, icon
 */
export const VISIT_STATUS_CONFIG = {
  [VISIT_STATUSES.PENDING]: {
    labelKey: 'visitStatus.pending',
    descriptionKey: 'visitStatus.pendingDesc',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-300',
    icon: 'clock',
    order: 1
  },
  [VISIT_STATUSES.ARRIVED]: {
    labelKey: 'visitStatus.arrived',
    descriptionKey: 'visitStatus.arrivedDesc',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    icon: 'check-circle',
    order: 2
  },
  [VISIT_STATUSES.IN_PROGRESS]: {
    labelKey: 'visitStatus.inProgress',
    descriptionKey: 'visitStatus.inProgressDesc',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-300',
    icon: 'play-circle',
    order: 3
  },
  [VISIT_STATUSES.COMPLETED_DEBT]: {
    labelKey: 'visitStatus.completedDebt',
    descriptionKey: 'visitStatus.completedDebtDesc',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'exclamation-circle',
    order: 4
  },
  [VISIT_STATUSES.COMPLETED_PAID]: {
    labelKey: 'visitStatus.completedPaid',
    descriptionKey: 'visitStatus.completedPaidDesc',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    icon: 'check-circle',
    order: 5
  },
  [VISIT_STATUSES.CANCELLED]: {
    labelKey: 'visitStatus.cancelled',
    descriptionKey: 'visitStatus.cancelledDesc',
    bgClass: 'bg-pink-100',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-300',
    icon: 'x-circle',
    order: 6
  },
  [VISIT_STATUSES.NO_SHOW]: {
    labelKey: 'visitStatus.noShow',
    descriptionKey: 'visitStatus.noShowDesc',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'x-mark',
    order: 7
  },
  [VISIT_STATUSES.ARCHIVED]: {
    labelKey: 'visitStatus.archived',
    descriptionKey: 'visitStatus.archivedDesc',
    bgClass: 'bg-gray-200',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-400',
    icon: 'archive',
    order: 8
  }
}

/**
 * Status konfiguratsiyasini olish
 * @param {string} status - Status kodi
 * @returns {object} - Status konfiguratsiyasi
 */
export const getVisitStatusConfig = (status) => {
  const config = VISIT_STATUS_CONFIG[status]
  if (config) {
    return {
      ...config,
      label: i18n.global.t(config.labelKey),
      description: i18n.global.t(config.descriptionKey)
    }
  }

  return {
    label: status || i18n.global.t('visitStatus.unknown'),
    description: i18n.global.t('visitStatus.unknownDesc'),
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
export const getVisitStatusLabel = (status) => {
  return getVisitStatusConfig(status).label
}

/**
 * Status ranglarini olish
 * @param {string} status - Status kodi
 * @returns {object} - { bgClass, textClass, borderClass }
 */
export const getVisitStatusColors = (status) => {
  const config = getVisitStatusConfig(status)
  return {
    bgClass: config.bgClass,
    textClass: config.textClass,
    borderClass: config.borderClass
  }
}

/**
 * Faol statuslar ro'yxati (archived dan tashqari)
 * @returns {array} - Faol statuslar
 */
export const getActiveStatuses = () => {
  return Object.values(VISIT_STATUSES).filter(s => s !== VISIT_STATUSES.ARCHIVED)
}

/**
 * Qarzdor statuslar
 * @returns {array} - Qarzdor statuslar
 */
export const getDebtStatuses = () => {
  return [VISIT_STATUSES.COMPLETED_DEBT]
}

/**
 * Tugallangan statuslar
 * @returns {array} - Tugallangan statuslar
 */
export const getCompletedStatuses = () => {
  return [VISIT_STATUSES.COMPLETED_DEBT, VISIT_STATUSES.COMPLETED_PAID]
}

/**
 * Aktiv statuslar (pending, arrived, in_progress)
 * @returns {array} - Aktiv statuslar
 */
export const getActiveVisitStatuses = () => {
  return [
    VISIT_STATUSES.PENDING,
    VISIT_STATUSES.ARRIVED,
    VISIT_STATUSES.IN_PROGRESS
  ]
}

/**
 * Status o'zgartirish mumkinligini tekshirish
 * @param {string} currentStatus - Hozirgi status
 * @param {string} newStatus - Yangi status
 * @param {number|null} debtAmount - Qarzdorlik summasi
 * @returns {boolean} - O'zgartirish mumkinmi?
 */
export const canChangeStatus = (currentStatus, newStatus, debtAmount = null) => {
  // Qarzdorlik tuzatilmasdan completed_paid ga o'tib ketmasin
  if (currentStatus === VISIT_STATUSES.COMPLETED_DEBT && newStatus === VISIT_STATUSES.COMPLETED_PAID) {
    return debtAmount === null || debtAmount === 0
  }
  
  // Boshqa holatlarda o'zgartirish mumkin
  return true
}

/**
 * Status o'zgartirish uchun ruxsat berilgan statuslar
 * @param {string} currentStatus - Hozirgi status
 * @returns {array} - Ruxsat berilgan statuslar
 */
export const getAllowedNextStatuses = (currentStatus) => {
  const statusFlow = {
    [VISIT_STATUSES.PENDING]: [VISIT_STATUSES.ARRIVED, VISIT_STATUSES.CANCELLED, VISIT_STATUSES.NO_SHOW],
    [VISIT_STATUSES.ARRIVED]: [VISIT_STATUSES.IN_PROGRESS, VISIT_STATUSES.CANCELLED, VISIT_STATUSES.NO_SHOW],
    [VISIT_STATUSES.IN_PROGRESS]: [
      VISIT_STATUSES.COMPLETED_DEBT,
      VISIT_STATUSES.COMPLETED_PAID,
      VISIT_STATUSES.CANCELLED
    ],
    [VISIT_STATUSES.COMPLETED_DEBT]: [VISIT_STATUSES.COMPLETED_PAID, VISIT_STATUSES.ARCHIVED],
    [VISIT_STATUSES.COMPLETED_PAID]: [VISIT_STATUSES.ARCHIVED],
    [VISIT_STATUSES.CANCELLED]: [VISIT_STATUSES.ARCHIVED],
    [VISIT_STATUSES.NO_SHOW]: [VISIT_STATUSES.ARCHIVED],
    [VISIT_STATUSES.ARCHIVED]: [] // Archived dan keyin o'zgartirish mumkin emas
  }
  
  return statusFlow[currentStatus] || []
}
