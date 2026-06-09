/**
 * doctorPermissions.js
 * Har bir doktor uchun modul va ma'lumot ruxsatlari.
 * Asosiy manba: Supabase doctors.module_permissions / doctors.data_permissions
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updateDoctorPermissions } from '@/api/doctorsApi'

export const MODULE_PERMISSIONS = [
  {
    key: 'can_view_dashboard',
    labelUz: 'Boshqaruv paneli',
    descUz: 'Asosiy dashboard sahifasiga kirish',
    alwaysEnabled: true,
  },
  {
    key: 'can_view_patients',
    labelUz: 'Bemorlar ro\'yxatini ko\'rish',
    descUz: 'Bemorlar sahifasiga kirish va ko\'rish',
  },
  {
    key: 'can_add_patients',
    labelUz: 'Bemor qo\'shish',
    descUz: 'Yangi bemor qo\'shish va ma\'lumotlarini tahrirlash',
  },
  {
    key: 'can_view_appointments',
    labelUz: 'Qabullar jadvalini ko\'rish',
    descUz: 'O\'zining qabul jadvalini ko\'rish',
  },
  {
    key: 'can_view_leads',
    labelUz: 'Murojatlarni ko\'rish',
    descUz: 'Yangi murojatlar (leads) ro\'yxatiga kirish',
  },
  {
    key: 'can_view_treatment_plans',
    labelUz: 'Davolanish rejalarini ko\'rish',
    descUz: 'Davolanish rejalari bo\'limiga kirish',
  },
  {
    key: 'can_edit_profile',
    labelUz: 'Profilni tahrirlash',
    descUz: 'O\'z profil ma\'lumotlarini o\'zgartirish',
  },
]

export const DEFAULT_PERMISSIONS = Object.fromEntries(
  MODULE_PERMISSIONS.map(m => [m.key, true])
)

export const DEFAULT_DATA_PERMISSIONS = {
  can_view_revenue: false,
  can_export_data: false,
  can_edit_prices: false,
  can_manage_medical_records: false,
  can_allow_debt_treatment: false,
}

export const DATA_PERMISSION_DEFS = [
  {
    key: 'can_view_revenue',
    labelUz: 'Klinika kassasi va moliyaviy hisobotlarini ko\'rish',
    descUz: 'Moliyaviy ko\'rsatkichlar va daromadlarni ko\'rish huquqi',
  },
  {
    key: 'can_export_data',
    labelUz: 'Bemorlar bazasini Excelga yuklab olish (Export)',
    descUz: 'Ma\'lumotlarni eksport qilish huquqi',
  },
  {
    key: 'can_edit_prices',
    labelUz: 'Xizmatlar narxini (Preyskurant) o\'zgartirish huquqi',
    descUz: 'Narxlar ro\'yxatini tahrirlash huquqi',
  },
  {
    key: 'can_manage_medical_records',
    labelUz: 'Bemorlar kasallik tarixi va shifokor ko\'rigi qaydlarini o\'chira oladi / tahrirlay oladi',
    descUz: 'O\'chirilgan bo\'lsa, xodim eski tibbiy yozuvlarni o\'zgartira olmaydi',
  },
  {
    key: 'can_allow_debt_treatment',
    labelUz: 'Bemorlarni qarzga davolashga ruxsat berish (Keyinchalik ishga tushadi)',
    descUz: 'Hozircha zaxira huquq — tizimda tez orada faollashtiriladi',
    disabled: true,
  },
]

const LEGACY_LS_PREFIX = 'shifo_dr_perms_'

/** @param {unknown} value */
export function parsePermissionsField(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

function mergeModulePermissions(raw) {
  const merged = { ...DEFAULT_PERMISSIONS, ...(raw || {}) }
  MODULE_PERMISSIONS.forEach(m => {
    if (m.alwaysEnabled) merged[m.key] = true
  })
  return merged
}

function mergeDataPermissions(raw) {
  return { ...DEFAULT_DATA_PERMISSIONS, ...(raw || {}) }
}

function legacyLocalStorageKey(clinicId, doctorId) {
  return `${LEGACY_LS_PREFIX}${clinicId}_${doctorId}`
}

function readLegacyModulePermissions(clinicId, doctorId) {
  if (!clinicId) return null
  const stored = localStorage.getItem(legacyLocalStorageKey(clinicId, doctorId))
  if (!stored) return null
  return parsePermissionsField(stored)
}

function clearLegacyModulePermissions(clinicId, doctorId) {
  if (!clinicId) return
  localStorage.removeItem(legacyLocalStorageKey(clinicId, doctorId))
}

export const useDoctorPermissionsStore = defineStore('doctorPermissions', () => {
  const permissionsMap = ref({})
  const dataPermissionsMap = ref({})

  const getPermissions = (doctorId) => {
    if (!doctorId) return { ...DEFAULT_PERMISSIONS }
    return permissionsMap.value[String(doctorId)] ?? { ...DEFAULT_PERMISSIONS }
  }

  const getDataPermissions = (doctorId) => {
    if (!doctorId) return { ...DEFAULT_DATA_PERMISSIONS }
    return dataPermissionsMap.value[String(doctorId)] ?? { ...DEFAULT_DATA_PERMISSIONS }
  }

  const hasPermission = (doctorId, key) => {
    const moduleDef = MODULE_PERMISSIONS.find(m => m.key === key)
    if (moduleDef?.alwaysEnabled) return true
    const perms = getPermissions(doctorId)
    return perms[key] !== false
  }

  const loadFromDoctor = (doctor, clinicId) => {
    if (!doctor?.id) return
    const doctorId = String(doctor.id)

    let moduleRaw = parsePermissionsField(doctor.module_permissions)
    const dataRaw = parsePermissionsField(doctor.data_permissions)

    // Eski localStorage dan bir martalik migratsiya
    if (!moduleRaw && clinicId) {
      moduleRaw = readLegacyModulePermissions(clinicId, doctorId)
      if (moduleRaw) {
        const mergedLegacy = mergeModulePermissions(moduleRaw)
        updateDoctorPermissions(doctor.id, { module_permissions: mergedLegacy })
          .then(() => clearLegacyModulePermissions(clinicId, doctorId))
          .catch((err) => {
            console.warn('[doctorPermissions] Legacy localStorage migratsiyasi muvaffaqiyatsiz:', err?.message)
          })
      }
    }

    permissionsMap.value = {
      ...permissionsMap.value,
      [doctorId]: mergeModulePermissions(moduleRaw),
    }

    dataPermissionsMap.value = {
      ...dataPermissionsMap.value,
      [doctorId]: mergeDataPermissions(dataRaw),
    }
  }

  /**
   * Modul va ma'lumot ruxsatlarini Supabase ga saqlaydi.
   * @returns {Promise<Object|null>} yangilangan doktor
   */
  const savePermissions = async (doctorId, modulePerms, clinicId, dataPerms = null) => {
    const id = String(doctorId)
    const mergedModule = mergeModulePermissions(modulePerms)
    const mergedData = mergeDataPermissions(dataPerms ?? getDataPermissions(doctorId))

    permissionsMap.value = { ...permissionsMap.value, [id]: mergedModule }
    dataPermissionsMap.value = { ...dataPermissionsMap.value, [id]: mergedData }

    const updated = await updateDoctorPermissions(doctorId, {
      module_permissions: mergedModule,
      data_permissions: mergedData,
    })

    clearLegacyModulePermissions(clinicId, id)
    return updated
  }

  const clearAll = () => {
    permissionsMap.value = {}
    dataPermissionsMap.value = {}
  }

  return {
    permissionsMap,
    dataPermissionsMap,
    getPermissions,
    getDataPermissions,
    hasPermission,
    loadFromDoctor,
    savePermissions,
    clearAll,
  }
})
