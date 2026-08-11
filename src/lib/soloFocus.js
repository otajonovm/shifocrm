/**
 * Yakka stomatolog (solo) uchun soddalashtirilgan interfeys.
 * Asosiy oqim: kalendar, onlayn qabullar, bemorlar, davolash rejalari, xizmatlar, hisobotlar, profil.
 */

export const SOLO_BLOCKED_ROUTE_NAMES = Object.freeze([
  'settings',
  'payments',
  'staff',
  'doctors',
  'inventory',
  'management-center',
  'audit',
  'my-appointments',
])

export const isSoloBlockedRoute = (routeName) =>
  SOLO_BLOCKED_ROUTE_NAMES.includes(String(routeName || ''))

export const getSoloHomeRoute = () => '/appointments'
