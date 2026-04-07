<template>
  <div :class="containerClass">
    <div class="mb-4">
      <h2 :class="embedded ? 'text-2xl font-extrabold tracking-tight text-slate-900' : 'text-3xl font-extrabold tracking-tight text-slate-900'">{{ tx.title }}</h2>
      <p class="text-sm text-slate-500 mt-1">{{ tx.subtitle }}</p>
    </div>

    <div class="mb-5 rounded-3xl border border-blue-100 bg-slate-50 p-4">
      <p class="text-xs uppercase tracking-wide text-slate-500">{{ tx.summary }}</p>
      <p class="mt-1 text-sm font-semibold text-slate-800">{{ tx.service }}: <span class="text-blue-700">{{ selectedServiceLabel }}</span></p>
      <p class="mt-1 text-sm font-semibold text-slate-800">{{ tx.dateTime }}: <span class="text-blue-700">{{ selectedDateTimeLabel }}</span></p>
      <p v-if="errors.slot" class="mt-2 text-xs text-rose-600">{{ errors.slot }}</p>
    </div>

    <form @submit.prevent="submitForm" class="space-y-5">
      <div>
        <label for="patient_name" class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ tx.fullName }} <span class="text-rose-500">*</span>
        </label>
        <input
          id="patient_name"
          v-model="form.patient_name"
          type="text"
          :placeholder="tx.fullNamePlaceholder"
          required
          minlength="2"
          maxlength="100"
          class="w-full h-12 px-4 border border-slate-300 bg-slate-50 rounded-3xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
          :disabled="submitting"
          @input="validateName"
        />
        <p v-if="errors.patient_name" class="text-rose-600 text-sm mt-1.5">
          {{ errors.patient_name }}
        </p>
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ tx.phone }} <span class="text-rose-500">*</span>
        </label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          inputmode="numeric"
          :placeholder="tx.phonePlaceholder"
          required
          class="w-full h-12 px-4 border border-slate-300 bg-slate-50 rounded-3xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
          :disabled="submitting"
          @input="onPhoneInput"
        />
        <p v-if="errors.phone" class="text-rose-600 text-sm mt-1.5">
          {{ errors.phone }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="submitting || !isFormValid"
        class="w-full rounded-3xl bg-[#2563eb] text-white text-base sm:text-lg font-bold py-4 px-4 transition active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-[0_10px_24px_rgba(37,99,235,0.32)]"
      >
        <span class="inline-flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.04 15.62 8.9 19c.5 0 .72-.22.98-.48l2.36-2.26 4.9 3.59c.9.5 1.53.24 1.77-.83L22.12 4.8h.01c.3-1.38-.5-1.92-1.38-1.6L2.9 10.1c-1.35.52-1.33 1.28-.23 1.62l4.56 1.42L17.8 6.56c.5-.32.96-.14.58.18" />
          </svg>
          {{ submitting ? tx.submitting : tx.submit }}
        </span>
      </button>
    </form>

    <div v-if="successMessage" class="mt-4 bg-emerald-50 border border-emerald-200 rounded-3xl p-4">
      <p class="text-emerald-900 text-center text-sm">
        ✓ {{ successMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { createLead } from '@/api/leadsApi'

const TELEGRAM_BOT_URL = 'https://t.me/shifocrm_bot'

const props = defineProps({
  doctorId: {
    type: Number,
    required: true
  },
  clinicId: {
    type: Number,
    required: true
  },
  initialDate: {
    type: String,
    default: ''
  },
  initialTime: {
    type: String,
    default: ''
  },
  selectedServiceName: {
    type: String,
    default: ''
  },
  defaultLanguage: {
    type: String,
    default: 'uz'
  },
  embedded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submitted'])

const toast = useToast()
const embedded = computed(() => Boolean(props.embedded))
const containerClass = computed(() => (
  embedded.value
    ? 'p-0'
    : 'bg-white/90 rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 backdrop-blur-sm'
))

const texts = {
  uz: {
    title: 'Qabulga yozilish',
    subtitle: 'Ma’lumotlarni kiriting, keyin Telegram botga o‘tasiz.',
    summary: 'Appointment Summary',
    service: 'Xizmat',
    dateTime: 'Sana / Vaqt',
    fullName: 'Ism familiya',
    fullNamePlaceholder: 'Aliyev Aziz',
    phone: 'Telefon raqam',
    phonePlaceholder: '+998 XX XXX XX XX',
    submit: 'Davom etish (Telegram bot)',
    submitting: 'Yuborilmoqda...',
    errorNameRequired: 'Ism kiritilishi shart',
    errorNameLength: 'Ism kamida 2 belgidan iborat bo‘lsin',
    errorPhoneRequired: 'Telefon raqam kiritilishi shart',
    errorPhoneInvalid: 'Telefon raqam to‘liq bo‘lishi kerak',
    errorSlotRequired: 'Iltimos avval sana va vaqtni tanlang',
    success: 'So‘rov qabul qilindi. Telegram botga yo‘naltirilmoqda...',
    successToast: 'So‘rov yuborildi. Botga o‘tilmoqda...',
    slotBusy: 'Tanlangan vaqt allaqachon band. Boshqa vaqt tanlang.',
    failed: 'So‘rovni saqlashda xatolik. Qayta urinib ko‘ring.',
    serviceFallback: 'Tanlanmagan',
    dateFallback: 'Tanlanmagan'
  },
  ru: {
    title: 'Запись на приём',
    subtitle: 'Заполните данные, затем перейдёте в Telegram-бот.',
    summary: 'Appointment Summary',
    service: 'Услуга',
    dateTime: 'Дата / Время',
    fullName: 'Имя и фамилия',
    fullNamePlaceholder: 'Алиев Азиз',
    phone: 'Номер телефона',
    phonePlaceholder: '+998 XX XXX XX XX',
    submit: 'Продолжить (Telegram бот)',
    submitting: 'Отправка...',
    errorNameRequired: 'Введите имя и фамилию',
    errorNameLength: 'Имя должно быть не менее 2 символов',
    errorPhoneRequired: 'Введите номер телефона',
    errorPhoneInvalid: 'Телефон введён не полностью',
    errorSlotRequired: 'Сначала выберите дату и время',
    success: 'Заявка принята. Переход в Telegram-бот...',
    successToast: 'Заявка отправлена. Переходим в бот...',
    slotBusy: 'Выбранное время уже занято. Выберите другое время.',
    failed: 'Ошибка сохранения заявки. Попробуйте снова.',
    serviceFallback: 'Не выбрано',
    dateFallback: 'Не выбрано'
  }
}

const isUzbek = ref(!String(props.defaultLanguage || 'uz').toLowerCase().startsWith('ru'))
const tx = computed(() => (isUzbek.value ? texts.uz : texts.ru))

const form = ref({
  patient_name: '',
  phone: ''
})

const errors = ref({
  patient_name: '',
  phone: '',
  slot: ''
})

const submitting = ref(false)
const successMessage = ref('')

watch(() => props.initialDate, (value) => {
  if (value) errors.value.slot = ''
})

watch(() => props.initialTime, (value) => {
  if (value) errors.value.slot = ''
})

watch(() => props.defaultLanguage, (value) => {
  isUzbek.value = !String(value || 'uz').toLowerCase().startsWith('ru')
})

const validateName = () => {
  errors.value.patient_name = ''
  const name = form.value.patient_name.trim()
  if (!name) {
    errors.value.patient_name = tx.value.errorNameRequired
  } else if (name.length < 2) {
    errors.value.patient_name = tx.value.errorNameLength
  }
}

const normalizePhoneDigits = (value) => String(value || '').replace(/\D+/g, '')

const formatPhoneUz = (value) => {
  let digits = normalizePhoneDigits(value)
  if (!digits.startsWith('998')) {
    digits = `998${digits}`
  }
  digits = digits.slice(0, 12)
  const local = digits.slice(3)

  let formatted = '+998'
  if (local.length > 0) formatted += ` ${local.slice(0, 2)}`
  if (local.length > 2) formatted += ` ${local.slice(2, 5)}`
  if (local.length > 5) formatted += ` ${local.slice(5, 7)}`
  if (local.length > 7) formatted += ` ${local.slice(7, 9)}`
  return formatted.trim()
}

const validatePhone = () => {
  errors.value.phone = ''
  const digits = normalizePhoneDigits(form.value.phone)
  if (!digits || digits.length <= 3) {
    errors.value.phone = tx.value.errorPhoneRequired
  } else if (digits.length !== 12) {
    errors.value.phone = tx.value.errorPhoneInvalid
  }
}

const onPhoneInput = (event) => {
  const next = formatPhoneUz(event?.target?.value ?? form.value.phone)
  form.value.phone = next
  validatePhone()
}

const hasSelectedSlot = computed(() => Boolean(String(props.initialDate || '').trim() && String(props.initialTime || '').trim()))
const isPhoneComplete = computed(() => normalizePhoneDigits(form.value.phone).length === 12)
const isFormValid = computed(() => {
  return form.value.patient_name.trim().length >= 2 && isPhoneComplete.value && hasSelectedSlot.value
})

const selectedServiceLabel = computed(() => {
  return String(props.selectedServiceName || '').trim() || tx.value.serviceFallback
})

const selectedDateTimeLabel = computed(() => {
  const dateText = String(props.initialDate || '').trim()
  const timeText = String(props.initialTime || '').trim()
  if (!dateText || !timeText) return tx.value.dateFallback

  const parsed = new Date(`${dateText}T00:00:00`)
  const locale = isUzbek.value ? 'uz-UZ' : 'ru-RU'
  const formattedDate = Number.isNaN(parsed.getTime())
    ? dateText
    : parsed.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })

  return `${formattedDate}, ${timeText.slice(0, 5)}`
})

const submitForm = async () => {
  validateName()
  validatePhone()
  errors.value.slot = ''
  if (!hasSelectedSlot.value) {
    errors.value.slot = tx.value.errorSlotRequired
  }

  if (!isFormValid.value || errors.value.patient_name || errors.value.phone || errors.value.slot) {
    return
  }

  submitting.value = true
  let shouldRedirectTelegram = false
  try {
    const createdLead = await createLead({
      doctor_id: props.doctorId,
      clinic_id: props.clinicId,
      patient_name: form.value.patient_name.trim(),
      phone: form.value.phone.trim(),
      preferred_date: String(props.initialDate || '').trim(),
      preferred_time: String(props.initialTime || '').trim(),
      selected_service: selectedServiceLabel.value
    })

    emit('submitted', {
      lead: createdLead,
      preferred_date: String(props.initialDate || '').trim(),
      preferred_time: String(props.initialTime || '').trim()
    })

    successMessage.value = tx.value.success
    toast.success(tx.value.successToast)
    shouldRedirectTelegram = true

    form.value = {
      patient_name: '',
      phone: ''
    }
    errors.value = {
      patient_name: '',
      phone: '',
      slot: ''
    }

    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (error) {
    console.error('Error submitting form:', error)
    if (error?.code === 'SLOT_ALREADY_BOOKED') {
      toast.error(error.message || tx.value.slotBusy)
      successMessage.value = ''
    } else {
      toast.error(tx.value.failed)
    }
  } finally {
    submitting.value = false
    if (shouldRedirectTelegram) {
      window.location.href = TELEGRAM_BOT_URL
    }
  }
}
</script>
