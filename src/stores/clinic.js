/**
 * Clinic settings (logo, name) — localStorage orqali.
 * Kelajakda Supabase Storage + clinic_settings jadvaliga o'tkazish mumkin.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY_LOGO = 'shifocrm_clinic_logo'
const STORAGE_KEY_NAME = 'shifocrm_clinic_name'
const DEFAULT_LOGO = '/logo.jpg'
const DEFAULT_NAME = 'SHIFOCRM'

export const useClinicStore = defineStore('clinic', () => {
  const logoUrl = ref(localStorage.getItem(STORAGE_KEY_LOGO) || DEFAULT_LOGO)
  const clinicName = ref(localStorage.getItem(STORAGE_KEY_NAME) || '')

  const isCustomLogo = computed(() => {
    const v = localStorage.getItem(STORAGE_KEY_LOGO)
    return !!v && v !== DEFAULT_LOGO
  })

  const displayName = computed(() => {
    const n = (clinicName.value ?? localStorage.getItem(STORAGE_KEY_NAME) ?? '').toString().trim()
    return n || DEFAULT_NAME
  })

  const isCustomName = computed(() => !!(clinicName.value ?? localStorage.getItem(STORAGE_KEY_NAME) ?? '').toString().trim())

  function setLogo(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return
    localStorage.setItem(STORAGE_KEY_LOGO, dataUrl)
    logoUrl.value = dataUrl
  }

  function clearLogo() {
    localStorage.removeItem(STORAGE_KEY_LOGO)
    logoUrl.value = DEFAULT_LOGO
  }

  function setClinicName(name) {
    const v = typeof name === 'string' ? name.trim() : ''
    localStorage.setItem(STORAGE_KEY_NAME, v)
    clinicName.value = v
  }

  function clearClinicName() {
    localStorage.removeItem(STORAGE_KEY_NAME)
    clinicName.value = ''
  }

  function getLogoUrl() {
    return localStorage.getItem(STORAGE_KEY_LOGO) || DEFAULT_LOGO
  }

  function getClinicName() {
    return localStorage.getItem(STORAGE_KEY_NAME) || ''
  }

  function initFromStorage() {
    logoUrl.value = getLogoUrl()
    clinicName.value = getClinicName()
  }

  return {
    logoUrl,
    clinicName,
    displayName,
    isCustomLogo,
    isCustomName,
    setLogo,
    clearLogo,
    setClinicName,
    clearClinicName,
    getLogoUrl,
    getClinicName,
    initFromStorage,
    defaultLogo: DEFAULT_LOGO,
    defaultName: DEFAULT_NAME
  }
})
