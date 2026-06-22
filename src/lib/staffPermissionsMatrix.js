/**
 * Staff ruxsatnomalar matritsasi: bo'limlar x CRUD actionlar.
 * Boshliq checkbox (select all) mantiqi shu modulda markazlashtirilgan.
 */

export const PERMISSION_SECTIONS = [
  { key: 'patients', labelUz: 'Bemorlar', labelRu: 'Пациенты' },
  { key: 'finances', labelUz: 'Moliya', labelRu: 'Финансы' },
  { key: 'warehouse', labelUz: 'Ombor', labelRu: 'Склад' },
  { key: 'analytics', labelUz: 'Analitika', labelRu: 'Аналитика' },
  { key: 'settings', labelUz: 'Sozlamalar', labelRu: 'Настройки' },
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
})

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

  PERMISSION_SECTIONS.forEach(({ key }) => {
    const section = source[key]
    if (!section || typeof section !== 'object') return
    PERMISSION_ACTIONS.forEach(({ key: action }) => {
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
    case 'administrator':
      set('patients', ['view', 'create', 'edit'])
      set('finances', ['view', 'create', 'edit'])
      set('warehouse', ['view', 'create'])
      set('analytics', ['view'])
      set('settings', ['view'])
      break
    case 'doctor':
      set('patients', ['view', 'create', 'edit'])
      set('analytics', ['view'])
      break
    case 'assistant':
      set('patients', ['view', 'create'])
      break
    case 'cashier':
      set('patients', ['view'])
      set('finances', ['view', 'create'])
      break
    default:
      break
  }

  return matrix
}
