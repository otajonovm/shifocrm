/**
 * Staff ruxsatnomalar matritsasi: bo'limlar x CRUD actionlar.
 * Boshliq checkbox (select all) mantiqi shu modulda markazlashtirilgan.
 */

export const PERMISSION_SECTIONS = [
  { key: 'dashboard', labelUz: 'Bosh sahifa', labelRu: 'Главная' },
  { key: 'patients', labelUz: 'Bemorlar', labelRu: 'Пациенты' },
  { key: 'staff', labelUz: 'Xodimlar', labelRu: 'Сотрудники' },
  { key: 'appointments', labelUz: 'Kalendar', labelRu: 'Календарь' },
  { key: 'leads', labelUz: 'Lidlar', labelRu: 'Лиды' },
  { key: 'payments', labelUz: "To'lovlar", labelRu: 'Платежи' },
  { key: 'finance', labelUz: 'Moliya capability', labelRu: 'Финансы' },
  { key: 'schedule', labelUz: 'Jadval capability', labelRu: 'Расписание' },
  { key: 'services', labelUz: 'Xizmatlar', labelRu: 'Услуги' },
  { key: 'warehouse', labelUz: 'Ombor', labelRu: 'Склад' },
  { key: 'treatment_plans', labelUz: 'Davolash rejalari', labelRu: 'Планы лечения' },
  { key: 'reports', labelUz: 'Hisobotlar', labelRu: 'Отчёты' },
  { key: 'settings', labelUz: 'Sozlamalar', labelRu: 'Настройки' },
]

/** Finance/schedule capability action keys (CRUD emas) */
export const FINANCE_CAPABILITY_ACTIONS = [
  'view_own_kpi',
  'view_team_kpi',
  'view_clinic_profit',
  'post_payment',
  'open_shift',
  'close_shift',
]

export const SCHEDULE_CAPABILITY_ACTIONS = [
  'view_team_month',
]

export const PERMISSION_ACTIONS = [
  { key: 'view', labelUz: "Ko'rish", labelRu: 'Просмотр' },
  { key: 'create', labelUz: "Qo'shish", labelRu: 'Добавление' },
  { key: 'edit', labelUz: 'Tahrirlash', labelRu: 'Редактирование' },
  { key: 'delete', labelUz: "O'chirish", labelRu: 'Удаление' },
]

const EMPTY_ACTIONS = () => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  view_own_kpi: false,
  view_team_kpi: false,
  view_clinic_profit: false,
  post_payment: false,
  open_shift: false,
  close_shift: false,
  view_team_month: false,
})

const LEGACY_SECTION_ALIASES = {
  finances: 'payments',
  analytics: 'reports',
}

/** Default bo'sh matritsa */
export function createEmptyPermissionsMatrix() {
  return Object.fromEntries(
    PERMISSION_SECTIONS.map(({ key }) => [key, EMPTY_ACTIONS()])
  )
}

/** Chuqur nusxa — Vue reactive obyekt uchun xavfsiz boshlang'ich holat */
export function clonePermissionsMatrix(source) {
  const base = createEmptyPermissionsMatrix()
  if (!source || typeof source !== 'object') return base

  Object.entries(LEGACY_SECTION_ALIASES).forEach(([legacyKey, currentKey]) => {
    const legacySection = source[legacyKey]
    if (!legacySection || typeof legacySection !== 'object') return
    Object.keys(base[currentKey]).forEach((action) => {
      base[currentKey][action] = legacySection[action] === true
    })
  })

  PERMISSION_SECTIONS.forEach(({ key }) => {
    const section = source[key]
    if (!section || typeof section !== 'object') return
    Object.keys(base[key]).forEach((action) => {
      base[key][action] = section[action] === true
    })
  })
  return base
}

export function sectionAllChecked(matrix, sectionKey) {
  const section = matrix?.[sectionKey]
  if (!section) return false
  return PERMISSION_ACTIONS.every(({ key }) => section[key] === true)
}

export function sectionAnyChecked(matrix, sectionKey) {
  const section = matrix?.[sectionKey]
  if (!section) return false
  return PERMISSION_ACTIONS.some(({ key }) => section[key] === true)
}

/** Ba'zi true, ba'zi false — boshliq checkbox indeterminate holati */
export function sectionIndeterminate(matrix, sectionKey) {
  return sectionAnyChecked(matrix, sectionKey) && !sectionAllChecked(matrix, sectionKey)
}

/** Bo'lim boshliq checkbox: barcha actionlarni bir vaqtda o'zgartirish */
export function toggleSection(matrix, sectionKey, checked) {
  if (!matrix[sectionKey]) {
    matrix[sectionKey] = EMPTY_ACTIONS()
  }
  PERMISSION_ACTIONS.forEach(({ key }) => {
    matrix[sectionKey][key] = !!checked
  })
}

/** Rol bo'yicha boshlang'ich matritsa */
export function defaultMatrixForRole(role) {
  const matrix = createEmptyPermissionsMatrix()
  const set = (section, actions) => {
    actions.forEach((action) => {
      matrix[section][action] = true
    })
  }

  switch (role) {
    case 'super_admin':
      PERMISSION_SECTIONS.forEach(({ key }) => {
        set(key, PERMISSION_ACTIONS.map(({ key: action }) => action))
      })
      break
    case 'administrator':
      set('dashboard', ['view'])
      set('patients', ['view', 'create', 'edit'])
      set('staff', ['view'])
      set('appointments', ['view', 'create', 'edit'])
      set('leads', ['view', 'create', 'edit'])
      set('payments', ['view', 'create', 'edit'])
      set('finance', ['view_own_kpi', 'view_team_kpi', 'view_clinic_profit', 'post_payment', 'open_shift', 'close_shift'])
      set('schedule', ['view_team_month'])
      set('services', ['view', 'create', 'edit'])
      set('warehouse', ['view', 'create'])
      set('treatment_plans', ['view', 'create', 'edit'])
      set('reports', ['view'])
      set('settings', ['view'])
      break
    case 'chief_doctor':
      set('dashboard', ['view'])
      set('patients', ['view', 'create', 'edit'])
      set('staff', ['view'])
      set('appointments', ['view', 'create', 'edit'])
      set('leads', ['view', 'edit'])
      set('treatment_plans', ['view', 'create', 'edit'])
      set('reports', ['view'])
      set('finance', ['view_own_kpi', 'view_team_kpi'])
      set('schedule', ['view_team_month'])
      break
    case 'doctor':
      set('dashboard', ['view'])
      set('patients', ['view', 'create', 'edit'])
      set('appointments', ['view', 'create', 'edit'])
      set('leads', ['view', 'edit'])
      set('treatment_plans', ['view', 'create', 'edit'])
      set('reports', ['view'])
      set('finance', ['view_own_kpi'])
      break
    case 'reception':
      set('dashboard', ['view'])
      set('patients', ['view', 'create', 'edit'])
      set('appointments', ['view', 'create', 'edit'])
      set('leads', ['view', 'create', 'edit'])
      set('payments', ['view'])
      break
    case 'assistant':
      set('dashboard', ['view'])
      set('patients', ['view', 'create'])
      set('appointments', ['view', 'create', 'edit'])
      set('leads', ['view', 'create', 'edit'])
      break
    case 'cashier':
      set('dashboard', ['view'])
      set('patients', ['view'])
      set('appointments', ['view'])
      set('payments', ['view', 'create'])
      set('finance', ['post_payment', 'open_shift', 'close_shift', 'view_own_kpi'])
      set('reports', ['view'])
      break
    default:
      break
  }

  return matrix
}
