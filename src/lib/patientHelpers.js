/**
 * Patient helper utilities
 */

/**
 * Ismdan initiallar olish (2 ta harf)
 * @param {string} name - To'liq ism
 * @returns {string} - Initiallar
 */
export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Jinsi kodini o'zbekchaga o'girish
 * @param {string} gender - male/female
 * @returns {string} - Erkak/Ayol/-
 */
export const formatGender = (gender) => {
  if (gender === 'male') return 'Erkak'
  if (gender === 'female') return 'Ayol'
  return '-'
}

/**
 * Telefon raqamini formatlash
 * @param {string} phone - Telefon raqami
 * @returns {string} - Formatlangan telefon
 */
export const formatPhone = (phone) => {
  if (!phone) return '-'
  return phone.replace(/\s+/g, ' ').trim()
}

/**
 * MED-ID formatlash
 * @param {number|string} id - Bemor ID
 * @returns {string} - #12345 formatida
 */
export const formatMedId = (id) => {
  if (!id) return '-'
  return `#${String(id).padStart(5, '0')}`
}

/**
 * Status badge rangi va matni
 * @param {string} status - active/inactive
 * @returns {object} - { text, bgClass, textClass }
 */
export const getStatusBadge = (status) => {
  if (status === 'active') {
    return {
      text: 'Faol',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700'
    }
  }
  return {
    text: 'Nofaol',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600'
  }
}

/**
 * Visit status badge (DEPRECATED - use VisitStatusBadge component instead)
 * @deprecated Use VisitStatusBadge component from @/components/ui/VisitStatusBadge.vue
 * @param {string} status - Visit status
 * @returns {object}
 */
export const getVisitStatusBadge = (status) => {
  // Backward compatibility - use new constants
  const { getVisitStatusConfig, getVisitStatusLabel, getVisitStatusColors } = require('@/constants/visitStatus')
  const config = getVisitStatusConfig(status)
  const colors = getVisitStatusColors(status)
  return {
    text: getVisitStatusLabel(status),
    bgClass: colors.bgClass,
    textClass: colors.textClass
  }
}
