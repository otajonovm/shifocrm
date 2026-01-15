/**
 * Date utility functions
 */

/**
 * Tug'ilgan sanadan yoshni hisoblash
 * @param {string} birthDate - Tug'ilgan sana (ISO format yoki YYYY-MM-DD)
 * @returns {number|null} - Yosh yoki null
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age >= 0 ? age : null
}

/**
 * Sanani formatlash (DD.MM.YYYY)
 * @param {string} dateStr - Sana string
 * @returns {string} - Formatlangan sana yoki '-'
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

/**
 * Sanani formatlash vaqt bilan (DD.MM.YYYY HH:mm)
 * @param {string} dateStr - Sana string
 * @returns {string} - Formatlangan sana va vaqt
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Bugungi sanani ISO formatda olish
 * @returns {string} - YYYY-MM-DD
 */
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Hozirgi vaqtni ISO formatda olish
 * @returns {string} - ISO datetime
 */
export const getNowISO = () => {
  return new Date().toISOString()
}
