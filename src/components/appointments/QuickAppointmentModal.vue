<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
        @click.self="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.98]"
        >
          <div
            v-if="open"
            class="w-full sm:max-w-lg bg-white sm:rounded-xl border-t sm:border border-slate-200 flex flex-col max-h-[92dvh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-appointment-title"
            @click="showSuggestions = false"
          >
            <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <h3 id="quick-appointment-title" class="text-base font-semibold text-slate-900">
                Tezkor qabul
              </h3>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                aria-label="Yopish"
                @click="$emit('close')"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <form class="p-5 space-y-5 overflow-y-auto" @submit.prevent="handleSave">
              <!-- 1-BO'LIM: Mavjud bemor qidirish -->
              <section class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h4 class="text-sm font-semibold text-slate-800">
                  Mavjud bemorlar bazasidan qidirish
                </h4>

                <div v-if="selectedPatient" class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <div class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {{ patientInitials }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ selectedPatient.full_name }}</p>
                    <p class="text-sm text-slate-500">{{ existingPatientPhone }}</p>
                  </div>
                  <button
                    type="button"
                    class="text-sm font-medium text-primary-600 hover:text-primary-800"
                    @click="clearExistingPatient"
                  >
                    O'zgartirish
                  </button>
                </div>

                <div v-else class="relative" @click.stop>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism yoki telefon</label>
                  <input
                    ref="searchInputRef"
                    v-model="searchQuery"
                    type="text"
                    autocomplete="off"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    @input="onSearchInput"
                    @focus="onSearchFocus"
                    @keydown.escape="showSuggestions = false"
                  />

                  <ul
                    v-if="canShowSuggestions && showSuggestions"
                    class="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg py-1"
                  >
                    <li
                      v-for="patient in filteredPatients"
                      :key="patient.id"
                      class="px-3 py-2.5 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      @mousedown.prevent="selectExistingPatient(patient)"
                    >
                      <span class="font-medium text-slate-900">{{ patient.full_name }}</span>
                      <span class="block text-sm text-slate-500 mt-0.5">{{ formatPhoneUzDisplay(patient.phone || '') }}</span>
                    </li>
                  </ul>
                </div>
              </section>

              <hr class="border-slate-100 my-1" />

              <!-- 2-BO'LIM: Yangi bemor -->
              <section
                class="rounded-xl border border-slate-200 p-4 space-y-3 transition-opacity duration-200"
                :class="selectedPatient ? 'opacity-50 pointer-events-none' : ''"
              >
                <h4 class="text-sm font-semibold text-slate-800">
                  Yangi bemor ro'yxatdan o'tkazish
                </h4>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism-sharif</label>
                  <input
                    v-model="newFullName"
                    type="text"
                    autocomplete="off"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    @input="onNewPatientFieldInput"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon raqami</label>
                  <input
                    :value="newPhone"
                    type="tel"
                    inputmode="tel"
                    autocomplete="tel"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    @input="onNewPhoneInput"
                    @focus="ensureNewPhonePrefix"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Jinsi</label>
                  <select
                    v-model="newGender"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    @change="onNewPatientFieldInput"
                  >
                    <option value="">Tanlang</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>
              </section>

              <!-- Qabul ma'lumotlari -->
              <section class="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <h4 class="text-sm font-semibold text-slate-800">Qabul ma'lumotlari</h4>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Qabul vaqti</label>
                  <div class="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800">
                    {{ appointmentTimeLabel }}
                  </div>
                </div>

                <div v-if="needsDoctorPick">
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Shifokor</label>
                  <select
                    v-model="doctorId"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Tanlang</option>
                    <option v-for="doc in doctors" :key="doc.id" :value="String(doc.id)">
                      {{ doc.full_name }}
                    </option>
                  </select>
                </div>

                <div v-else>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Shifokor</label>
                  <div class="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800">
                    {{ resolvedDoctorName }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Izoh</label>
                  <input
                    v-model="notes"
                    type="text"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </section>

              <p v-if="conflictMessage" class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ {{ conflictMessage }}
              </p>

              <p v-if="error" class="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {{ error }}
              </p>

              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                  @click="$emit('close')"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  :disabled="saving || !canSave"
                >
                  {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import {
  formatPhoneUzDisplay,
  formatPhoneForStorage,
  isValidUzPhone,
} from '@/lib/phoneUz'
import { createPatient } from '@/api/patientsApi'
import { createAppointment } from '@/api/appointmentsApi'
import * as visitsApi from '@/api/visitsApi'
import { findAppointmentConflicts, formatConflictMessage } from '@/lib/appointmentConflict'

const props = defineProps({
  open: { type: Boolean, default: false },
  slotMeta: {
    type: Object,
    default: () => ({ doctorId: null, date: '', startTime: '' }),
  },
  patients: { type: Array, default: () => [] },
  doctors: { type: Array, default: () => [] },
  isAdmin: { type: Boolean, default: false },
  defaultDoctorId: { type: [String, Number], default: '' },
  dayVisits: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const searchQuery = ref('')
const selectedPatientId = ref('')
const newFullName = ref('')
const newPhone = ref('+998')
const newGender = ref('')
const doctorId = ref('')
const notes = ref('')
const saving = ref(false)
const error = ref('')
const showSuggestions = ref(false)
const searchInputRef = ref(null)

const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
]

const formatSlotDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return `${d} ${MONTHS_UZ[m - 1] || ''} ${y}`
}

const appointmentTimeLabel = computed(() => {
  const { date, startTime } = props.slotMeta || {}
  if (!date && !startTime) return '—'
  const parts = []
  if (date) parts.push(formatSlotDate(date))
  if (startTime) parts.push(startTime)
  return parts.join(', ')
})

const selectedPatient = computed(() => {
  if (!selectedPatientId.value) return null
  return props.patients.find((p) => String(p.id) === String(selectedPatientId.value)) || null
})

const existingPatientPhone = computed(() => {
  if (!selectedPatient.value) return ''
  return formatPhoneUzDisplay(selectedPatient.value.phone || '')
})

const patientInitials = computed(() => {
  const name = selectedPatient.value?.full_name || ''
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
})

const needsDoctorPick = computed(() => props.isAdmin && !props.slotMeta?.doctorId)

const resolvedDoctorId = computed(() => {
  if (props.isAdmin) {
    return props.slotMeta?.doctorId || doctorId.value
  }
  return props.slotMeta?.doctorId || props.defaultDoctorId
})

const resolvedDoctorName = computed(() => {
  const doc = props.doctors.find((d) => String(d.id) === String(resolvedDoctorId.value))
  return doc?.full_name || '—'
})

const canShowSuggestions = computed(() => searchQuery.value.trim().length >= 2)

const filteredPatients = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (q.length < 2) return []
  return props.patients
    .filter((p) => {
      const name = String(p.full_name || '').toLowerCase()
      const ph = String(p.phone || '')
      return name.includes(q) || ph.includes(q.replace(/\D/g, ''))
    })
    .slice(0, 8)
})

const isNewPatientActive = computed(() => {
  return !selectedPatientId.value && (
    newFullName.value.trim().length > 0
    || newPhone.value.replace(/\D/g, '').length > 3
    || !!newGender.value
  )
})

const canSave = computed(() => {
  const hasExisting = !!selectedPatientId.value
  const hasNew = newFullName.value.trim().length >= 2 && isValidUzPhone(newPhone.value)
  if (!hasExisting && !hasNew) return false
  if (needsDoctorPick.value && !doctorId.value) return false
  if (appointmentConflicts.value.length) return false
  return true
})

const appointmentConflicts = computed(() => {
  const date = props.slotMeta?.date
  const startTime = props.slotMeta?.startTime
  const docId = resolvedDoctorId.value
  if (!date || !startTime || !docId) return []

  return findAppointmentConflicts({
    visits: props.dayVisits,
    doctorId: docId,
    date,
    startTime,
    durationMinutes: 60,
  })
})

const conflictMessage = computed(() => {
  if (!appointmentConflicts.value.length) return ''
  const patientMap = {}
  for (const p of props.patients) {
    patientMap[Number(p.id)] = p.full_name
  }
  return formatConflictMessage(appointmentConflicts.value, { patientMap })
})

const resetForm = () => {
  searchQuery.value = ''
  selectedPatientId.value = ''
  newFullName.value = ''
  newPhone.value = '+998'
  newGender.value = ''
  notes.value = ''
  error.value = ''
  showSuggestions.value = false
  doctorId.value = props.slotMeta?.doctorId != null
    ? String(props.slotMeta.doctorId)
    : (props.defaultDoctorId ? String(props.defaultDoctorId) : '')
}

watch(() => props.open, (isOpen) => {
  if (isOpen) resetForm()
})

const onSearchInput = () => {
  if (canShowSuggestions.value) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

const onSearchFocus = () => {
  if (canShowSuggestions.value) {
    showSuggestions.value = true
  }
}

const selectExistingPatient = (patient) => {
  selectedPatientId.value = String(patient.id)
  searchQuery.value = patient.full_name || ''
  showSuggestions.value = false
  clearNewPatientFields()
}

const clearExistingPatient = () => {
  selectedPatientId.value = ''
  searchQuery.value = ''
  showSuggestions.value = false
  searchInputRef.value?.focus()
}

const clearNewPatientFields = () => {
  newFullName.value = ''
  newPhone.value = '+998'
  newGender.value = ''
}

const onNewPatientFieldInput = () => {
  if (selectedPatientId.value) {
    selectedPatientId.value = ''
    searchQuery.value = ''
  }
}

const ensureNewPhonePrefix = () => {
  if (!newPhone.value) newPhone.value = '+998'
}

const onNewPhoneInput = (event) => {
  onNewPatientFieldInput()
  newPhone.value = formatPhoneUzDisplay(event.target.value)
  event.target.value = newPhone.value
}

const handleBackdropClick = () => {
  showSuggestions.value = false
  emit('close')
}

const buildEndTime = (startTime, durationMinutes = 60) => {
  const [h, m] = String(startTime || '09:00').split(':').map(Number)
  const total = h * 60 + m + durationMinutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

const resolvePatientId = async () => {
  if (selectedPatientId.value) {
    return Number(selectedPatientId.value)
  }

  const fullName = newFullName.value.trim()
  if (fullName.length < 2) {
    throw new Error('Yangi bemor ism-sharifini kiriting.')
  }

  const storedPhone = formatPhoneForStorage(newPhone.value)
  if (!storedPhone || !isValidUzPhone(newPhone.value)) {
    throw new Error('Yangi bemor telefon raqamini to\'liq kiriting.')
  }

  const byPhone = props.patients.find(
    (p) => formatPhoneForStorage(p.phone) === storedPhone
  )
  if (byPhone) return Number(byPhone.id)

  const doc = props.doctors.find((d) => String(d.id) === String(resolvedDoctorId.value))
  const created = await createPatient({
    full_name: fullName,
    phone: storedPhone,
    gender: newGender.value || null,
    doctor_id: resolvedDoctorId.value || null,
    doctor_name: doc?.full_name || null,
    status: 'waiting',
    createFirstVisit: false,
  })
  return Number(created.id)
}

const handleSave = async () => {
  error.value = ''
  const date = props.slotMeta?.date
  const startTime = props.slotMeta?.startTime
  const doctorIdResolved = resolvedDoctorId.value

  if (!date || !startTime) {
    error.value = 'Vaqt tanlanmagan. Katakchadan qayta urinib ko\'ring.'
    return
  }
  if (!doctorIdResolved) {
    error.value = 'Shifokorni tanlang.'
    return
  }
  if (appointmentConflicts.value.length) {
    error.value = conflictMessage.value || 'Ushbu vaqt allaqachon band.'
    return
  }
  if (!selectedPatientId.value && !isNewPatientActive.value) {
    error.value = 'Mavjud bemorni tanlang yoki yangi bemor ma\'lumotlarini kiriting.'
    return
  }

  saving.value = true
  try {
    const patientId = await resolvePatientId()
    const doctor = props.doctors.find((d) => String(d.id) === String(doctorIdResolved))
    const durationMinutes = 60
    const endTime = buildEndTime(startTime, durationMinutes)

    await visitsApi.createVisit({
      patient_id: patientId,
      doctor_id: Number(doctorIdResolved),
      doctor_name: doctor?.full_name || '',
      notes: notes.value?.trim() || null,
      status: 'pending',
      date,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
    })

    try {
      const scheduledAt = `${date}T${startTime.length === 5 ? startTime : startTime.slice(0, 5)}:00`
      await createAppointment({
        patient_id: patientId,
        doctor_id: Number(doctorIdResolved),
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        notes: notes.value?.trim() || null,
      })
    } catch (syncErr) {
      console.warn('appointments jadvali sinxronlash:', syncErr?.message)
    }

    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err?.message || 'Qabulni saqlab bo\'lmadi.'
  } finally {
    saving.value = false
  }
}
</script>
