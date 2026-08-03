/**
 * Legacy session helpers — Edge JWT o'chirilgan.
 * Sessiya localStorage orqali auth store da saqlanadi.
 */

export const getAccessToken = () => null

export const getSecureSession = () => null

export const authenticateLegacySession = async () => {
  throw new Error('Edge session o‘chirilgan. Oddiy login ishlatiladi.')
}

export const validateSecureSession = async () => null

export const revokeSecureSession = async () => {}

export const clearSecureSession = () => {}
