<template>
  <div class="mobile-card border border-primary-100 bg-gradient-to-br from-primary-50/80 to-white">
    <div class="flex flex-col sm:flex-row sm:items-start gap-4">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">
          {{ t('doctorProfile.linkCardTitle') }}
        </p>
        <p class="mt-0.5 text-sm text-gray-600">{{ t('doctorProfile.linkCardSubtitle') }}</p>

        <div v-if="loading" class="mt-3 text-sm text-gray-500">{{ t('reports.loading') }}</div>

        <template v-else-if="hasSlug && doctor?.is_public">
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <code class="flex-1 min-w-0 truncate rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800">
              {{ publicUrl }}
            </code>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50"
              @click="copyLink"
            >
              {{ t('doctorProfile.copyLink') }}
            </button>
            <a
              :href="publicUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
            >
              {{ t('doctorProfile.openPage') }}
            </a>
          </div>
        </template>

        <div v-else class="mt-3 space-y-3">
          <p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {{ t('soloFocus.setupBookingHint') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              v-model="slugDraft"
              type="text"
              class="mobile-input flex-1 text-sm"
              :placeholder="t('doctorProfile.publicSlugLabel')"
            />
            <button
              type="button"
              class="mobile-btn-primary text-sm px-4"
              :disabled="saving || !slugDraft.trim()"
              @click="saveSlug"
            >
              {{ saving ? t('soloFocus.saving') : t('soloFocus.activateLink') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasSlug && doctor?.is_public" class="shrink-0 flex flex-col items-center gap-2">
        <div class="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
          <canvas ref="qrCanvasRef" class="block" />
        </div>
        <button
          type="button"
          class="text-xs font-medium text-primary-600 hover:text-primary-800"
          @click="downloadQr"
        >
          {{ t('doctorProfile.downloadQr') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { getDoctorById, updateDoctor } from '@/api/doctorsApi'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const doctor = ref(null)
const slugDraft = ref('')
const qrCanvasRef = ref(null)

const doctorId = computed(() => Number(authStore.user?.id))

const hasSlug = computed(() => Boolean(String(doctor.value?.public_slug || '').trim()))

const publicUrl = computed(() => {
  if (!hasSlug.value) return ''
  return `${window.location.origin}/d/${doctor.value.public_slug}`
})

const loadDoctor = async () => {
  if (!Number.isFinite(doctorId.value)) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    doctor.value = await getDoctorById(doctorId.value)
    slugDraft.value = doctor.value?.public_slug || ''
  } catch {
    doctor.value = null
  } finally {
    loading.value = false
    await nextTick()
    await renderQr()
  }
}

const renderQr = async () => {
  if (!qrCanvasRef.value || !hasSlug.value || !doctor.value?.is_public) return
  const canvas = qrCanvasRef.value
  const size = 160
  canvas.width = size
  canvas.height = size
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  await QRCode.toCanvas(canvas, publicUrl.value, {
    width: size,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' },
  })
}

const copyLink = async () => {
  if (!publicUrl.value) return
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    toast.success(t('doctorProfile.copied'))
  } catch {
    toast.error(t('doctorProfile.copyFailed'))
  }
}

const downloadQr = async () => {
  if (!qrCanvasRef.value) return
  const link = document.createElement('a')
  link.download = `shifocrm-${doctor.value.public_slug}.png`
  link.href = qrCanvasRef.value.toDataURL('image/png')
  link.click()
}

const saveSlug = async () => {
  const raw = slugDraft.value.trim().toLowerCase()
  const safeSlug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!safeSlug || !Number.isFinite(doctorId.value)) return

  saving.value = true
  try {
    await updateDoctor(doctorId.value, {
      public_slug: safeSlug,
      is_public: true,
    })
    doctor.value = { ...doctor.value, public_slug: safeSlug, is_public: true }
    toast.success(t('soloFocus.linkActivated'))
    await nextTick()
    await renderQr()
  } catch (err) {
    toast.error(err?.message || t('doctorProfile.errorProfileNotLoaded'))
  } finally {
    saving.value = false
  }
}

watch(publicUrl, () => {
  renderQr()
})

onMounted(loadDoctor)
</script>
