<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div v-if="loading" class="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 text-slate-600">
        {{ t('clinicPublic.loading') }}
      </div>

      <div v-else-if="!clinic" class="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
        <h1 class="text-2xl font-bold text-slate-900">{{ t('clinicPublic.notFoundTitle') }}</h1>
        <p class="mt-2 text-slate-600">{{ t('clinicPublic.notFoundSubtitle') }}</p>
      </div>

      <div v-else class="space-y-6">
        <section class="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
          <div class="flex items-start gap-4">
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img v-if="clinic.logo_url" :src="clinic.logo_url" :alt="clinic.name" class="h-full w-full object-contain" />
              <span v-else class="text-xl font-semibold text-primary-600">{{ initials }}</span>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ clinic.name }}</h1>
              <p v-if="clinic.description" class="mt-2 text-slate-600 whitespace-pre-line">{{ clinic.description }}</p>
              <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span v-if="clinic.address">📍 {{ clinic.address }}</span>
                <a
                  v-if="clinic.location_url"
                  :href="clinic.location_url"
                  target="_blank"
                  rel="noopener"
                  class="text-primary-600 hover:text-primary-700"
                >
                  {{ t('clinicPublic.openMap') }}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
          <h2 class="text-xl font-semibold text-slate-900">{{ t('clinicPublic.workingHoursTitle') }}</h2>
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="item in scheduleRows" :key="item.key" class="rounded-xl border border-slate-200 p-3">
              <p class="text-sm font-medium text-slate-900">{{ item.label }}</p>
              <p class="mt-1 text-sm" :class="item.enabled ? 'text-slate-700' : 'text-slate-400'">
                {{ item.enabled ? `${item.start} - ${item.end}` : t('clinicPublic.dayOff') }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
          <h2 class="text-xl font-semibold text-slate-900">{{ t('clinicPublic.doctorsTitle') }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ t('clinicPublic.doctorsSubtitle') }}</p>

          <div v-if="doctors.length === 0" class="mt-4 text-sm text-slate-500">
            {{ t('clinicPublic.noDoctors') }}
          </div>

          <div v-else class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <article v-for="doctor in doctors" :key="doctor.id" class="rounded-xl border border-slate-200 p-4">
              <h3 class="text-base font-semibold text-slate-900">{{ doctor.full_name }}</h3>
              <p class="mt-1 text-sm text-slate-600">{{ doctor.specialization || t('clinicPublic.doctorFallback') }}</p>
              <a
                v-if="doctor.public_slug"
                :href="`${origin}/d/${doctor.public_slug}`"
                target="_blank"
                rel="noopener"
                class="mt-3 inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {{ t('clinicPublic.bookNow') }}
              </a>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getClinicByPublicSlug, getPublicDoctorsByClinic } from '@/api/clinicsPublicApi'

const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const clinic = ref(null)
const doctors = ref([])

const origin = window.location.origin

const initials = computed(() => {
  const value = String(clinic.value?.name || '').trim()
  if (!value) return 'CL'
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const dayLabels = computed(() => ({
  mon: t('doctorProfile.dayMon'),
  tue: t('doctorProfile.dayTue'),
  wed: t('doctorProfile.dayWed'),
  thu: t('doctorProfile.dayThu'),
  fri: t('doctorProfile.dayFri'),
  sat: t('doctorProfile.daySat'),
  sun: t('doctorProfile.daySun'),
}))

const scheduleRows = computed(() => {
  const days = clinic.value?.work_schedule?.days || {}
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return order.map((key) => {
    const current = days[key] || {}
    return {
      key,
      label: dayLabels.value[key] || key,
      enabled: Boolean(current.enabled),
      start: current.start || '09:00',
      end: current.end || '18:00',
    }
  })
})

async function loadClinicPage() {
  loading.value = true
  try {
    const slug = String(route.params.slug || '').trim().toLowerCase()
    const found = await getClinicByPublicSlug(slug)
    clinic.value = found

    if (found?.id) {
      doctors.value = await getPublicDoctorsByClinic(found.id)
    } else {
      doctors.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadClinicPage)
</script>
