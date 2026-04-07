<template>
  <div class="min-h-screen bg-gradient-to-b from-[#EAF6FF] via-[#F4FAFF] to-white" style="font-family: Inter, Poppins, 'Segoe UI', system-ui, sans-serif;">
    <!-- Error State -->
    <div v-if="error" class="max-w-2xl mx-auto px-4 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h1 class="text-2xl font-bold text-red-900 mb-2">{{ t('publicDoctorProfile.notFoundTitle') }}</h1>
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="max-w-2xl mx-auto px-4 py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">{{ t('publicDoctorProfile.loading') }}</p>
      </div>
    </div>

    <!-- Doctor Profile -->
    <div v-else-if="doctor" class="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <section class="rounded-[24px] bg-white/65 border border-white/80 shadow-[0_12px_35px_rgba(29,78,216,0.12)] overflow-hidden backdrop-blur-xl">
        <div class="h-24 bg-gradient-to-r from-sky-300 via-sky-400 to-blue-500"></div>
        <div class="px-5 pb-5 -mt-10">
          <div class="flex items-end gap-3">
            <img
              v-if="doctor.public_avatar_url"
              :src="doctor.public_avatar_url"
              :alt="doctor.full_name"
              class="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
            <div v-else class="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-3xl text-sky-700">
              👨‍⚕️
            </div>
          </div>

          <div class="mt-4 flex items-center justify-end">
            <div class="inline-flex rounded-xl border border-sky-100 bg-white/90 p-1 shadow-sm">
              <button
                type="button"
                @click="setPublicLanguage('uz')"
                :class="publicLanguage === 'uz' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-sky-50'"
                class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              >
                UZ
              </button>
              <button
                type="button"
                @click="setPublicLanguage('ru')"
                :class="publicLanguage === 'ru' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-sky-50'"
                class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              >
                RU
              </button>
            </div>
          </div>

          <h1 class="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{{ doctor.full_name }}</h1>
          <p class="mt-1 text-sky-700 font-semibold">{{ doctor.specialization || t('publicDoctorProfile.specializationFallback') }}</p>
          <p v-if="clinic" class="mt-1 text-sm text-slate-500">{{ clinic.name }}</p>

          <p v-if="doctor.public_bio" class="mt-4 text-sm leading-6 text-gray-700">
            {{ doctor.public_bio }}
          </p>

          <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              :href="`tel:${doctor.public_phone || doctor.public_whatsapp}`"
              class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-sky-600 hover:to-blue-700"
            >
              {{ t('publicDoctorProfile.call') }}
            </a>
            <a
              v-if="doctor.public_location_url"
              :href="doctor.public_location_url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center rounded-xl bg-white text-blue-700 border border-blue-200 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50"
            >
              {{ t('publicDoctorProfile.showOnMap') }}
            </a>
            <a
              v-if="doctor.public_telegram"
              :href="`https://t.me/${doctor.public_telegram.replace('@', '')}`"
              target="_blank"
              class="inline-flex items-center justify-center rounded-xl bg-white text-sky-700 border border-sky-200 px-4 py-2.5 text-sm font-semibold hover:bg-sky-50"
            >
              Telegram
            </a>
            <a
              v-if="doctor.public_whatsapp"
              :href="`https://wa.me/${doctor.public_whatsapp.replace(/[^0-9]/g, '')}`"
              target="_blank"
              class="inline-flex items-center justify-center rounded-xl bg-white text-emerald-700 border border-emerald-200 px-4 py-2.5 text-sm font-semibold hover:bg-emerald-50"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section class="rounded-[24px] border border-white/80 bg-white/70 p-4 sm:p-5 md:p-7 shadow-[0_10px_30px_rgba(14,116,144,0.12)] backdrop-blur-xl">
        <div class="mb-4">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{{ t('publicDoctorProfile.bookingTitle') }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ t('publicDoctorProfile.selectSlotHint') }}</p>
        </div>

        <div class="mb-5">
          <div class="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              v-for="day in availableSlots"
              :key="day.date"
              type="button"
              @click="setActiveDate(day.date)"
              :class="activeDate === day.date
                ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                : 'bg-white text-slate-700 border-sky-100 hover:bg-sky-50'"
              class="shrink-0 rounded-2xl border px-3 py-2 min-w-[86px] text-center transition"
            >
              <div class="text-xs font-semibold opacity-90">{{ formatDateChip(day.date).day }}</div>
              <div class="text-lg font-extrabold leading-none mt-0.5">{{ formatDateChip(day.date).date }}</div>
            </button>
          </div>
        </div>

        <div v-if="availableSlots.length > 0" class="space-y-4">
          <div
            v-for="group in slotGroups"
            :key="group.key"
            class="rounded-2xl border border-sky-100 bg-white/80 p-3.5"
          >
            <div class="flex items-center justify-between mb-2.5">
              <h3 class="text-sm font-bold text-slate-800">{{ group.title }}</h3>
              <span class="text-xs text-slate-500">{{ group.slots.length }} slots</span>
            </div>

            <div v-if="group.slots.length" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                v-for="slot in group.slots"
                :key="`${activeDate}-${group.key}-${slot.start}`"
                type="button"
                @click="pickSlot(activeDate, slot.start)"
                :class="selectedDate === activeDate && selectedTime === slot.start
                  ? 'bg-sky-700 text-white border-sky-700 shadow'
                  : 'bg-[#F5FBFF] text-sky-800 border-sky-200 hover:bg-sky-100'"
                class="rounded-xl border px-2 py-2 text-sm font-bold leading-none transition"
              >
                {{ slot.start }}
              </button>
            </div>
            <p v-else class="text-xs text-slate-400">{{ t('publicDoctorProfile.slotsEmpty') }}</p>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-dashed border-sky-200 bg-white/80 p-4 text-sm text-slate-500">
          {{ t('publicDoctorProfile.slotsEmpty') }}
        </div>

        <div class="mt-5">
          <p class="text-sm text-slate-500 mb-2">{{ t('publicDoctorProfile.serviceLabel') }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="(service, index) in visualServices"
              :key="`${service.id || index}`"
              @click="selectService(service.id)"
              :class="String(selectedServiceId) === String(service.id)
                ? 'border-blue-400 bg-blue-50/80'
                : 'border-sky-100 bg-white/85'"
              class="rounded-2xl border p-3.5 shadow-[0_8px_22px_rgba(56,189,248,0.10)] cursor-pointer transition"
            >
              <div class="flex items-center gap-3">
                <div class="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200 border border-white shadow-inner flex items-center justify-center">
                  <img
                    :src="service.icon"
                    alt="Dental icon"
                    class="h-7 w-7 object-contain drop-shadow"
                  />
                </div>
                <div>
                  <div class="text-sm font-semibold text-slate-900">{{ service.name }}</div>
                  <div class="text-xs text-slate-500">{{ t('publicDoctorProfile.priceFrom') }} {{ formatServicePrice(service.price) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-slate-200/80">
          <DoctorLeadForm
            embedded
            :doctor-id="doctor.id"
            :clinic-id="doctor.clinic_id"
            :initial-date="selectedDate"
            :initial-time="selectedTime"
            :selected-service-name="selectedService?.name || ''"
            :default-language="publicLanguage"
            @submitted="handleLeadSubmitted"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import DoctorLeadForm from '@/components/public/DoctorLeadForm.vue'
import { setLocale } from '@/i18n'
import {
  getDoctorByPublicSlug,
  getDoctorServices,
  getDoctorClinicInfo,
  getDoctorAvailableSlots
} from '@/api/doctorsPublicApi'

const route = useRoute()
const { t, locale } = useI18n()
const toast = useToast()

const doctor = ref(null)
const clinic = ref(null)
const services = ref([])
const availableSlots = ref([])
const activeDate = ref('')
const selectedDate = ref('')
const selectedTime = ref('')
const selectedServiceId = ref(null)
const publicLanguage = ref('uz')
const loading = ref(true)
const error = ref(null)
const activeDay = computed(() => (
  availableSlots.value.find(item => item.date === activeDate.value)
  || availableSlots.value[0]
  || null
))
const activeDaySlots = computed(() => activeDay.value?.slots || [])

const slotGroups = computed(() => {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: [],
  }

  activeDaySlots.value.forEach((slot) => {
    const [hourRaw] = String(slot.start || '').split(':')
    const hour = Number(hourRaw)
    if (!Number.isFinite(hour)) return
    if (hour < 12) grouped.morning.push(slot)
    else if (hour < 17) grouped.afternoon.push(slot)
    else grouped.evening.push(slot)
  })

  return [
    {
      key: 'morning',
      title: String(locale.value).startsWith('ru') ? 'Утро' : 'Ertalab',
      slots: grouped.morning
    },
    {
      key: 'afternoon',
      title: String(locale.value).startsWith('ru') ? 'День' : 'Kunduzi',
      slots: grouped.afternoon
    },
    {
      key: 'evening',
      title: String(locale.value).startsWith('ru') ? 'Вечер' : 'Kechqurun',
      slots: grouped.evening
    },
  ]
})

const serviceIcons = ['/teeth/11.svg', '/teeth/21.svg', '/teeth/31.svg']

const visualServices = computed(() => {
  const source = services.value.length > 0
    ? services.value.slice(0, 3)
    : [{ id: 'fallback', name: t('publicDoctorProfile.noService'), price: 0 }]

  return source.map((service, index) => ({
    ...service,
    icon: serviceIcons[index % serviceIcons.length]
  }))
})

const selectedService = computed(() => {
  const byId = visualServices.value.find((item) => String(item.id) === String(selectedServiceId.value))
  return byId || visualServices.value[0] || null
})

watch(publicLanguage, (lang) => {
  const safeLang = String(lang).toLowerCase().startsWith('ru') ? 'ru' : 'uz'
  if (locale.value !== safeLang) {
    setLocale(safeLang)
  }
})

const setPublicLanguage = (lang) => {
  publicLanguage.value = String(lang).toLowerCase().startsWith('ru') ? 'ru' : 'uz'
}

const formatDateChip = (dateText) => {
  const date = new Date(`${String(dateText)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return { day: 'Day', date: '--' }

  const isRu = String(locale.value).startsWith('ru')
  const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
  const ruDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  return {
    day: isRu ? ruDays[date.getDay()] : uzDays[date.getDay()],
    date: date.toLocaleDateString(isRu ? 'ru-RU' : 'uz-UZ', { day: '2-digit' })
  }
}

const formatServicePrice = (price) => {
  const amount = Number(price || 0)
  if (!Number.isFinite(amount) || amount <= 0) return '—'
  return `${amount.toLocaleString('ru-RU')} ${t('common.currencySuffix')}`
}

const setActiveDate = (date) => {
  activeDate.value = String(date || '')
}

const selectService = (serviceId) => {
  selectedServiceId.value = serviceId
}

const pickSlot = (date, time) => {
  selectedDate.value = String(date || '')
  selectedTime.value = String(time || '')
  activeDate.value = String(date || '')
  toast.success(t('publicDoctorProfile.slotSelected', { date, time }))
}

const loadAvailableSlots = async () => {
  if (!doctor.value?.id) {
    availableSlots.value = []
    return
  }

  availableSlots.value = await getDoctorAvailableSlots({
    doctorId: doctor.value.id,
    workSchedule: doctor.value.work_schedule,
    daysAhead: 14,
    slotMinutes: 30
  })

  if (availableSlots.value.length && !availableSlots.value.some(item => item.date === activeDate.value)) {
    activeDate.value = availableSlots.value[0].date
  }
}

const hasSlotInAvailability = (date, time) => {
  const day = availableSlots.value.find(item => item.date === date)
  if (!day) return false
  return (day.slots || []).some(slot => String(slot.start) === String(time))
}

const handleLeadSubmitted = async ({ preferred_date, preferred_time } = {}) => {
  await loadAvailableSlots()
  if (preferred_date && preferred_time && !hasSlotInAvailability(preferred_date, preferred_time)) {
    selectedDate.value = ''
    selectedTime.value = ''
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const slug = route.params.slug

    // Fetch doctor
    const doctorData = await getDoctorByPublicSlug(slug)
    if (!doctorData) {
      error.value = t('publicDoctorProfile.errorNotFound')
      return
    }

    doctor.value = doctorData
    const initialLang = String(doctorData?.public_language || doctorData?.language || locale.value || 'uz').toLowerCase()
    publicLanguage.value = initialLang.startsWith('ru') ? 'ru' : 'uz'

    // Fetch clinic info
    const clinicData = await getDoctorClinicInfo(doctorData.clinic_id)
    clinic.value = clinicData

    // Fetch services (optional)
    services.value = await getDoctorServices(doctorData.clinic_id)
    if (services.value.length > 0) {
      selectedServiceId.value = services.value[0].id
    }

    // Build dynamic available slots
    await loadAvailableSlots()
    if (availableSlots.value.length) {
      activeDate.value = availableSlots.value[0].date
    }
  } catch (err) {
    console.error('Error loading doctor profile:', err)
    error.value = t('publicDoctorProfile.errorLoad')
  } finally {
    loading.value = false
  }
})
</script>
