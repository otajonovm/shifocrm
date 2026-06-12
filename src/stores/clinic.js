/**
 * Clinic settings (logo, name) — localStorage orqali.
 * Kelajakda Supabase Storage + clinic_settings jadvaliga o'tkazish mumkin.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
  DEFAULT_CALENDAR_END,
  DEFAULT_CALENDAR_START,
  normalizeCalendarTime,
} from '@/lib/clinicCalendarHours'

const STORAGE_KEY_LOGO = 'shifocrm_clinic_logo'
const STORAGE_KEY_NAME = 'shifocrm_clinic_name'
const STORAGE_KEY_CALENDAR_START = 'shifocrm_calendar_start'
const STORAGE_KEY_CALENDAR_END = 'shifocrm_calendar_end'
const DEFAULT_LOGO = '/logo.jpg'
const DEFAULT_NAME = 'SHIFOCRM'

export const useClinicStore = defineStore('clinic', () => {
  const logoUrl = ref(localStorage.getItem(STORAGE_KEY_LOGO) || DEFAULT_LOGO)
  const clinicName = ref(localStorage.getItem(STORAGE_KEY_NAME) || '')
  const calendarStartTime = ref(
    normalizeCalendarTime(localStorage.getItem(STORAGE_KEY_CALENDAR_START) || DEFAULT_CALENDAR_START)
  )
  const calendarEndTime = ref(
    normalizeCalendarTime(localStorage.getItem(STORAGE_KEY_CALENDAR_END) || DEFAULT_CALENDAR_END)
  )

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

  function setCalendarHours(start, end) {
    const startNorm = normalizeCalendarTime(start) || DEFAULT_CALENDAR_START
    const endNorm = normalizeCalendarTime(end) || DEFAULT_CALENDAR_END
    localStorage.setItem(STORAGE_KEY_CALENDAR_START, startNorm)
    localStorage.setItem(STORAGE_KEY_CALENDAR_END, endNorm)
    calendarStartTime.value = startNorm
    calendarEndTime.value = endNorm
  }

  function loadCalendarFromWorkSchedule(workSchedule) {
    if (!workSchedule || typeof workSchedule !== 'object') return
    const start = workSchedule.calendar_start || workSchedule.calendarStart
    const end = workSchedule.calendar_end || workSchedule.calendarEnd
    if (start || end) {
      setCalendarHours(start || calendarStartTime.value, end || calendarEndTime.value)
    }
  }

  function initFromStorage() {
    logoUrl.value = getLogoUrl()
    clinicName.value = getClinicName()
    calendarStartTime.value = normalizeCalendarTime(
      localStorage.getItem(STORAGE_KEY_CALENDAR_START) || DEFAULT_CALENDAR_START
    )
    calendarEndTime.value = normalizeCalendarTime(
      localStorage.getItem(STORAGE_KEY_CALENDAR_END) || DEFAULT_CALENDAR_END
    )
  }

  async function loadFromClinicId(clinicId) {
    const id = Number(clinicId)
    if (!Number.isFinite(id)) return
    try {
      const { getClinic } = await import('@/services/adminService')
      const clinic = await getClinic(id)
      if (!clinic) return
      if (clinic.name) setClinicName(clinic.name)
      if (clinic.logo_url) setLogo(clinic.logo_url)
      loadCalendarFromWorkSchedule(clinic.work_schedule)
    } catch {
      // Klinika ma'lumotlari ixtiyoriy — default nom qoladi
    }
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
    loadFromClinicId,
    calendarStartTime,
    calendarEndTime,
    setCalendarHours,
    loadCalendarFromWorkSchedule,
    defaultLogo: DEFAULT_LOGO,
    defaultName: DEFAULT_NAME,
  }
})
