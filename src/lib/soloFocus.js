/**
 * Yakka stomatolog (solo) uchun minimal interfeys.
 * Asosiy oqim: kalendar, bemorlar, xizmatlar, hisobotlar va profil.
 */

export const SOLO_BLOCKED_ROUTE_NAMES = Object.freeze([
  'treatment-plans',
  'settings',
  'my-leads',
  'payments',
  'leads',
  'staff',
  'doctors',
  'inventory',
  'management-center',
  'data-import',
  'audit',
  'my-appointments',
])

export const isSoloBlockedRoute = (routeName) =>
  SOLO_BLOCKED_ROUTE_NAMES.includes(String(routeName || ''))

export const getSoloHomeRoute = () => '/appointments'
