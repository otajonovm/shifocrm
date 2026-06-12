<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">
      <!-- Sahifa sarlavhasi -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Klinika sozlamalari</h1>
        <p class="text-sm text-gray-500 mt-1">
          Klinika profili, kalendar va veb-sayt sozlamalarini shu yerda boshqaring. Xodimlar — alohida «Xodimlar» bo'limida.
        </p>
      </div>

      <template v-if="isClinicAdmin">
        <!-- 1-SEKSIYA: Klinika umumiy ma'lumotlari -->
        <section class="bg-white shadow-sm border border-slate-100 rounded-xl p-6 space-y-5">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">Klinika profili va ma'lumotlari</h2>
            <p class="text-sm text-gray-500 mt-1">
              Klinika nomi, aloqa va ijtimoiy tarmoqlar — tizim va vizitka uchun asosiy ma'lumotlar.
            </p>
          </div>

          <!-- Logotip -->
          <div class="flex flex-wrap items-start gap-6">
            <div class="flex flex-col items-center gap-2">
              <div class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                <img v-if="profile.logo_url" :src="profile.logo_url" alt="Logo" class="w-full h-full object-contain" />
                <PhotoIcon v-else class="w-9 h-9 text-slate-300" />
              </div>
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors">
                <ArrowUpTrayIcon class="w-4 h-4" />
                Logotip yuklash
                <input type="file" accept="image/*" class="hidden" @change="onLogoSelect" />
              </label>
              <button
                v-if="profile.logo_url"
                type="button"
                class="text-xs text-gray-500 hover:text-rose-600"
                @click="removeLogo"
              >
                Olib tashlash
              </button>
            </div>
            <div class="flex-1 min-w-[220px] space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Klinika nomi</label>
                <input
                  v-model="profile.name"
                  type="text"
                  placeholder="Masalan: Shifo Stomatologiya"
                  class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Telefon raqami</label>
                  <input
                    :value="profile.clinic_phone"
                    type="tel"
                    inputmode="tel"
                    placeholder="+998 (90) 123-45-67"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    @input="onClinicPhoneInput"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    v-model="profile.clinic_email"
                    type="email"
                    placeholder="info@klinika.uz"
                    class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Manzil</label>
            <input
              v-model="profile.address"
              type="text"
              placeholder="Toshkent sh., Chilonzor tumani, ..."
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Telegram</label>
              <input
                v-model="profile.telegram_url"
                type="url"
                placeholder="https://t.me/klinika_nomi"
                class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
              <input
                v-model="profile.instagram_url"
                type="url"
                placeholder="https://instagram.com/klinika_nomi"
                class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <p v-if="logoError" class="text-sm text-rose-600">{{ logoError }}</p>
        </section>

        <!-- 2-SEKSIYA: Kalendar va ish vaqti -->
        <section class="bg-white shadow-sm border border-slate-100 rounded-xl p-6 space-y-5">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">Kalendar jadvali va ish vaqti sozlamalari</h2>
            <p class="text-sm text-gray-500 mt-1">
              Bu yerda belgilangan soatlar kalendar jadvalida aks etadi va tungi keraksiz soatlarni yashiradi.
            </p>
          </div>

          <p class="text-xs font-medium text-primary-700 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
            24 soatlik format — AM/PM yo'q. Ro'yxatdan soatni tanlang: 01:00 dan 24:00 gacha.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Ish boshlanish vaqti</label>
              <Hour24Select
                v-model="profile.work_schedule.calendar_start"
                :max-hour="calendarEndHour - 1"
              />
              <p class="mt-1 text-xs text-gray-400">Tanlangan: {{ profile.work_schedule.calendar_start }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Ish tugash vaqti</label>
              <Hour24Select
                v-model="profile.work_schedule.calendar_end"
                :min-hour="calendarStartHour + 1"
              />
              <p class="mt-1 text-xs text-gray-400">Tanlangan: {{ profile.work_schedule.calendar_end }}</p>
            </div>
          </div>

          <p class="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            Masalan: boshlanish <strong>08:00</strong>, tugash <strong>20:00</strong> — kalendar faqat shu oralikdagi qatorlarni ko'rsatadi.
          </p>
        </section>

        <!-- 3-SEKSIYA: Veb-sayt va marketing -->
        <section class="bg-white shadow-sm border border-slate-100 rounded-xl p-6 space-y-5">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">Klinika veb-sayti tahrirlagichi</h2>
            <p class="text-sm text-gray-500 mt-1">
              Klinikangizning tashqi vizitka sayti uchun ma'lumotlar, shifokorlar haqida qisqacha tavsif va reklama matnlarini shu yerda boshqaring.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Veb-sayt bosh sarlavhasi</label>
            <input
              v-model="profile.website_header_title"
              type="text"
              placeholder="Masalan: Shifo — Sizning tabassumingiz bizning g'amimiz"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Klinika haqida qisqacha reklama matni</label>
            <textarea
              v-model="profile.description"
              rows="4"
              placeholder="Klinika xizmatlari, afzalliklari va bemorlar uchun qisqa tavsif..."
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Sayt havolasi (slug)</label>
            <input
              v-model="profile.slug"
              type="text"
              placeholder="shifo-clinic"
              class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="mt-1 text-xs text-gray-400">Faqat lotin harflari, raqam va chiziqcha. Saqlangandan keyin havola ishlaydi.</p>
          </div>

          <div v-if="websiteUrl" class="flex flex-wrap gap-2">
            <input
              :value="websiteUrl"
              readonly
              class="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-gray-600"
            />
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              @click="copyWebsiteUrl"
            >
              Nusxalash
            </button>
            <a
              :href="websiteUrl"
              target="_blank"
              rel="noopener"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 text-center"
            >
              Saytni ko'rish
            </a>
          </div>

          <!-- Toggle: sayt faol / nofaol -->
          <div class="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-900">Veb-sayt holati</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ profile.is_active ? 'Sayt bemorlar uchun ochiq' : 'Sayt vaqtincha yopilgan' }}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="profile.is_active"
              class="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :class="profile.is_active ? 'bg-primary-600' : 'bg-gray-300'"
              @click="profile.is_active = !profile.is_active"
            >
              <span
                class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="profile.is_active ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </section>

        <!-- Umumiy saqlash tugmasi -->
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="savingProfile"
            class="inline-flex items-center justify-center gap-2 min-w-[200px] px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-colors"
            @click="saveClinicProfile"
          >
            <span
              v-if="savingProfile"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
            <span>{{ savingProfile ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash' }}</span>
          </button>
        </div>
      </template>

      <!-- Til sozlamalari (alohida, darhol qo'llanadi) -->
      <section class="bg-white shadow-sm border border-slate-100 rounded-xl p-6 space-y-4">
        <div class="flex items-center gap-3">
          <Cog6ToothIcon class="w-5 h-5 text-gray-400" />
          <h2 class="text-base font-semibold text-gray-900">Tizim tili</h2>
        </div>
        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Interfeys tili</label>
          <select
            v-model="currentLocale"
            class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="uz">O'zbekcha</option>
            <option value="ru">Русский</option>
          </select>
          <p class="mt-1.5 text-xs text-gray-400">Tanlangan til butun tizimga darhol qo'llanadi.</p>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import Hour24Select from '@/components/shared/Hour24Select.vue'
import { useClinicStore } from '@/stores/clinic'
import { useAuthStore } from '@/stores/auth'
import { isAdminLike } from '@/lib/roles'
import { resizeLogoFile } from '@/lib/logoResize'
import { formatPhoneUzDisplay, formatPhoneForStorage } from '@/lib/phoneUz'
import {
  DEFAULT_CALENDAR_END,
  DEFAULT_CALENDAR_START,
  normalizeCalendarTime,
  timeStringToHour,
  validateCalendarHours,
} from '@/lib/clinicCalendarHours'
import { Cog6ToothIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import { setLocale } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getClinic, updateClinic } from '@/services/adminService'

const { locale } = useI18n()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const toast = useToast()

const isClinicAdmin = computed(() => isAdminLike(authStore))

const currentLocale = ref(locale.value)
const logoError = ref('')
const savingProfile = ref(false)
const currentClinicId = ref(null)

const buildDefaultSchedule = () => ({
  timezone: 'Asia/Tashkent',
  calendar_start: DEFAULT_CALENDAR_START,
  calendar_end: DEFAULT_CALENDAR_END,
  clinic_phone: '',
  clinic_email: '',
  telegram_url: '',
  instagram_url: '',
  website_header_title: '',
  days: {
    mon: { enabled: true, start: '09:00', end: '18:00' },
    tue: { enabled: true, start: '09:00', end: '18:00' },
    wed: { enabled: true, start: '09:00', end: '18:00' },
    thu: { enabled: true, start: '09:00', end: '18:00' },
    fri: { enabled: true, start: '09:00', end: '18:00' },
    sat: { enabled: false, start: '09:00', end: '14:00' },
    sun: { enabled: false, start: '09:00', end: '14:00' },
  },
})

const normalizeSchedule = (input) => {
  const fallback = buildDefaultSchedule()
  if (!input || typeof input !== 'object') return fallback
  const merged = { ...fallback, ...input }
  merged.calendar_start = normalizeCalendarTime(merged.calendar_start) || fallback.calendar_start
  merged.calendar_end = normalizeCalendarTime(merged.calendar_end) || fallback.calendar_end
  merged.clinic_phone = merged.clinic_phone || ''
  merged.clinic_email = merged.clinic_email || ''
  merged.telegram_url = merged.telegram_url || ''
  merged.instagram_url = merged.instagram_url || ''
  merged.website_header_title = merged.website_header_title || ''
  merged.days = { ...fallback.days, ...(input.days || {}) }
  Object.keys(merged.days).forEach((day) => {
    merged.days[day] = { ...fallback.days[day], ...merged.days[day] }
  })
  return merged
}

const profile = ref({
  name: '',
  slug: '',
  logo_url: clinicStore.logoUrl || '',
  address: '',
  description: '',
  clinic_phone: '',
  clinic_email: '',
  telegram_url: '',
  instagram_url: '',
  website_header_title: '',
  is_active: true,
  work_schedule: buildDefaultSchedule(),
})

const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const websiteUrl = computed(() => {
  const slug = normalizeSlug(profile.value.slug)
  if (!slug) return ''
  return `${window.location.origin}/c/${slug}`
})

const calendarStartHour = computed(() =>
  timeStringToHour(profile.value.work_schedule.calendar_start) ?? 8
)

const calendarEndHour = computed(() =>
  timeStringToHour(profile.value.work_schedule.calendar_end) ?? 20
)

watch(calendarStartHour, (startH) => {
  const endH = calendarEndHour.value
  if (endH <= startH) {
    const next = Math.min(startH + 1, 24)
    profile.value.work_schedule.calendar_end = `${String(next).padStart(2, '0')}:00`
  }
})

watch(currentLocale, (newLocale) => {
  setLocale(newLocale)
})

const onClinicPhoneInput = (event) => {
  profile.value.clinic_phone = formatPhoneUzDisplay(event.target.value)
  event.target.value = profile.value.clinic_phone
}

const buildWorkSchedulePayload = () => {
  const ws = { ...profile.value.work_schedule }
  ws.clinic_phone = formatPhoneForStorage(profile.value.clinic_phone) || profile.value.clinic_phone || ''
  ws.clinic_email = profile.value.clinic_email?.trim() || ''
  ws.telegram_url = profile.value.telegram_url?.trim() || ''
  ws.instagram_url = profile.value.instagram_url?.trim() || ''
  ws.website_header_title = profile.value.website_header_title?.trim() || ''
  return ws
}

const loadClinicProfile = async () => {
  try {
    currentClinicId.value = await getCurrentClinicId()
    if (!currentClinicId.value) return

    const clinic = await getClinic(currentClinicId.value)
    if (!clinic) return

    const ws = normalizeSchedule(clinic.work_schedule)

    profile.value = {
      name: clinic.name || clinicStore.getClinicName() || '',
      slug: clinic.slug || '',
      logo_url: clinic.logo_url || clinicStore.logoUrl || '',
      address: clinic.address || '',
      description: clinic.description || '',
      clinic_phone: ws.clinic_phone ? formatPhoneUzDisplay(ws.clinic_phone) : '',
      clinic_email: ws.clinic_email || '',
      telegram_url: ws.telegram_url || '',
      instagram_url: ws.instagram_url || '',
      website_header_title: ws.website_header_title || '',
      is_active: clinic.is_active !== false,
      work_schedule: ws,
    }

    clinicStore.setClinicName(profile.value.name)
    if (profile.value.logo_url) {
      clinicStore.setLogo(profile.value.logo_url)
    }
    clinicStore.setCalendarHours(
      profile.value.work_schedule.calendar_start,
      profile.value.work_schedule.calendar_end
    )
  } catch (error) {
    console.error('Failed to load clinic profile:', error)
    toast.error('Klinika sozlamalarini yuklab bo\'lmadi.')
  }
}

const saveClinicProfile = async () => {
  if (!currentClinicId.value) {
    toast.error('Klinika topilmadi. Qayta kiring.')
    return
  }

  savingProfile.value = true
  try {
    const calendarError = validateCalendarHours(
      profile.value.work_schedule.calendar_start,
      profile.value.work_schedule.calendar_end
    )
    if (calendarError) {
      toast.error(calendarError)
      return
    }

    const safeSlug = normalizeSlug(profile.value.slug)
    const workSchedule = buildWorkSchedulePayload()

    await updateClinic(currentClinicId.value, {
      name: profile.value.name,
      ...(safeSlug ? { slug: safeSlug } : {}),
      logo_url: profile.value.logo_url || null,
      address: profile.value.address || null,
      description: profile.value.description || null,
      work_schedule: workSchedule,
      is_active: profile.value.is_active,
    })

    profile.value.work_schedule = workSchedule

    clinicStore.setClinicName(profile.value.name)
    if (profile.value.logo_url) {
      clinicStore.setLogo(profile.value.logo_url)
    } else {
      clinicStore.clearLogo()
    }
    clinicStore.setCalendarHours(
      workSchedule.calendar_start,
      workSchedule.calendar_end
    )

    toast.success('Sozlamalar muvaffaqiyatli yangilandi')
  } catch (error) {
    console.error('Failed to save clinic profile:', error)
    toast.error(error?.message || 'Sozlamalarni saqlab bo\'lmadi.')
  } finally {
    savingProfile.value = false
  }
}

async function onLogoSelect(e) {
  logoError.value = ''
  const file = e.target?.files?.[0]
  if (!file) return
  try {
    const dataUrl = await resizeLogoFile(file)
    profile.value.logo_url = dataUrl
    toast.success('Logotip yuklandi')
  } catch (err) {
    logoError.value = err.message || 'Rasm yuklanmadi. Faqat PNG, JPG yoki WEBP.'
    toast.error(logoError.value)
  }
  e.target.value = ''
}

function removeLogo() {
  profile.value.logo_url = ''
  logoError.value = ''
}

async function copyWebsiteUrl() {
  if (!websiteUrl.value) return
  try {
    await navigator.clipboard.writeText(websiteUrl.value)
    toast.success('Sayt havolasi nusxalandi')
  } catch {
    toast.error('Havolani nusxalab bo\'lmadi')
  }
}

onMounted(async () => {
  if (isClinicAdmin.value) {
    await loadClinicProfile()
  }
})
</script>
