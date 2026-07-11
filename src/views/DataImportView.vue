<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in pb-6 pb-safe max-w-6xl mx-auto">
      <div class="flex items-start gap-3">
        <router-link
          to="/patients"
          class="flex-shrink-0 p-2.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
          :title="t('dataImport.backToPatients')"
        >
          <ArrowLeftIcon class="w-6 h-6" />
        </router-link>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('dataImport.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t('dataImport.subtitle') }}</p>
        </div>
      </div>

      <!-- Steps -->
      <div class="flex items-center gap-2 text-xs sm:text-sm">
        <span
          v-for="(label, idx) in stepLabels"
          :key="idx"
          class="px-3 py-1.5 rounded-full font-medium"
          :class="step === idx + 1 ? 'bg-primary-100 text-primary-800' : step > idx + 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'"
        >
          {{ idx + 1 }}. {{ label }}
        </span>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="step === 1" class="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-5">
        <div class="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            class="rounded-xl border-2 border-dashed p-6 text-left transition-colors hover:border-primary-400 hover:bg-primary-50/30"
            :class="sourceType === 'csv' ? 'border-primary-500 bg-primary-50/40' : 'border-gray-200'"
            @click="sourceType = 'csv'"
          >
            <DocumentTextIcon class="w-8 h-8 text-primary-600 mb-3" />
            <p class="font-semibold text-gray-900">{{ t('dataImport.csvTitle') }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ t('dataImport.csvHint') }}</p>
          </button>
          <button
            type="button"
            class="rounded-xl border-2 border-dashed p-6 text-left transition-colors hover:border-violet-400 hover:bg-violet-50/30"
            :class="sourceType === 'vision' ? 'border-violet-500 bg-violet-50/40' : 'border-gray-200'"
            @click="sourceType = 'vision'"
          >
            <CameraIcon class="w-8 h-8 text-violet-600 mb-3" />
            <p class="font-semibold text-gray-900">{{ t('dataImport.photoTitle') }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ t('dataImport.photoHint') }}</p>
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="text-sm text-primary-600 hover:underline"
            @click="downloadTemplateCsv"
          >
            {{ t('dataImport.downloadTemplate') }}
          </button>
          <button
            type="button"
            class="text-sm text-primary-600 hover:underline"
            @click="downloadTemplateExcel"
          >
            {{ t('dataImport.downloadTemplateExcel') }}
          </button>
        </div>

        <div v-if="sourceType === 'vision'" class="rounded-xl border border-violet-100 bg-violet-50/60 p-4 text-sm text-violet-900 space-y-2">
          <p class="font-medium">{{ t('dataImport.photoTipsTitle') }}</p>
          <ul class="list-disc list-inside space-y-1 text-violet-800">
            <li>{{ t('dataImport.photoTip1') }}</li>
            <li>{{ t('dataImport.photoTip2') }}</li>
            <li>{{ t('dataImport.photoTip3') }}</li>
          </ul>
        </div>

        <div v-if="previewImageUrl" class="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <img :src="previewImageUrl" alt="" class="max-h-64 w-full object-contain" />
        </div>

        <div>
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            :accept="sourceType === 'csv' ? '.csv,.txt,.xlsx,.xls' : 'image/jpeg,image/png,image/webp,image/*'"
            :capture="sourceType === 'vision' ? 'environment' : undefined"
            @change="onFileSelected"
          />
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            :disabled="parsing"
            @click="fileInputRef?.click()"
          >
            <ArrowUpTrayIcon class="w-5 h-5" />
            {{ parsing ? (sourceType === 'vision' ? t('dataImport.parsingVision') : t('dataImport.parsing')) : (sourceType === 'vision' ? t('dataImport.selectPhoto') : t('dataImport.selectFile')) }}
          </button>
          <p v-if="selectedFileName" class="mt-2 text-sm text-gray-600">{{ selectedFileName }}</p>
        </div>

        <p v-if="parseError" class="text-sm text-rose-600">{{ parseError }}</p>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="step === 2" class="space-y-4">
        <div
          v-if="resolvedSourceType === 'vision'"
          class="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900"
        >
          {{ t('dataImport.visionPreviewHint') }}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-600">
            {{ t('dataImport.previewCount', { total: previewRows.length, selected: selectedCount }) }}
          </p>
          <div class="flex gap-2">
            <button type="button" class="text-sm text-gray-600 hover:underline" @click="step = 1">
              {{ t('dataImport.back') }}
            </button>
            <button
              type="button"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              :disabled="selectedCount === 0 || importing"
              @click="runImport"
            >
              {{ importing ? t('dataImport.importing') : t('dataImport.confirmImport') }}
            </button>
          </div>
        </div>

        <ImportPreviewTable v-model:rows="previewRows" />
      </div>

      <!-- Step 3: Results -->
      <div v-if="step === 3" class="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-4">
        <div class="flex items-center gap-3">
          <CheckCircleIcon class="w-10 h-10 text-emerald-600" />
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('dataImport.doneTitle') }}</h2>
            <p class="text-sm text-gray-500">{{ t('dataImport.doneSubtitle') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="rounded-xl bg-emerald-50 p-4 text-center">
            <p class="text-2xl font-bold text-emerald-700">{{ importResult?.imported ?? 0 }}</p>
            <p class="text-xs text-emerald-800">{{ t('dataImport.imported') }}</p>
          </div>
          <div class="rounded-xl bg-sky-50 p-4 text-center">
            <p class="text-2xl font-bold text-sky-700">{{ importResult?.visitIds?.length ?? 0 }}</p>
            <p class="text-xs text-sky-800">{{ t('dataImport.visitsCreated') }}</p>
          </div>
          <div class="rounded-xl bg-indigo-50 p-4 text-center">
            <p class="text-2xl font-bold text-indigo-700">{{ importResult?.paymentIds?.length ?? 0 }}</p>
            <p class="text-xs text-indigo-800">{{ t('dataImport.paymentsCreated') }}</p>
          </div>
          <div class="rounded-xl bg-violet-50 p-4 text-center">
            <p class="text-2xl font-bold text-violet-700">{{ importResult?.appointmentIds?.length ?? 0 }}</p>
            <p class="text-xs text-violet-800">{{ t('dataImport.calendarBooked') }}</p>
          </div>
          <div class="rounded-xl bg-rose-50 p-4 text-center">
            <p class="text-2xl font-bold text-rose-700">{{ importResult?.failed ?? 0 }}</p>
            <p class="text-xs text-rose-800">{{ t('dataImport.failed') }}</p>
          </div>
          <div class="rounded-xl bg-amber-50 p-4 text-center">
            <p class="text-2xl font-bold text-amber-700">{{ formatRevenue(importResult?.totalRevenue) }}</p>
            <p class="text-xs text-amber-800">{{ t('dataImport.financeTotal') }}</p>
          </div>
        </div>

        <ul v-if="importResult?.errors?.length" class="text-sm text-rose-700 space-y-1">
          <li v-for="(err, i) in importResult.errors.slice(0, 5)" :key="i">
            {{ err.name }}: {{ err.message }}
          </li>
        </ul>

        <div class="flex gap-3 pt-2">
          <router-link to="/patients" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">
            {{ t('dataImport.goPatients') }}
          </router-link>
          <button type="button" class="rounded-lg border border-gray-200 px-4 py-2 text-sm" @click="resetWizard">
            {{ t('dataImport.newImport') }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import ImportPreviewTable from '@/components/dataImport/ImportPreviewTable.vue'
import {
  parseSpreadsheetFile,
  parseVisionImage,
  prepareImportPreview,
  commitImportRows,
  downloadImportTemplateCsv,
  downloadImportTemplateExcel,
} from '@/api/dataImportApi'
import {
  ArrowUpTrayIcon,
  ArrowLeftIcon,
  CameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()

const step = ref(1)
const sourceType = ref('csv')
const resolvedSourceType = ref('csv')
const fileInputRef = ref(null)
const selectedFileName = ref('')
const parsing = ref(false)
const parseError = ref('')
const previewRows = ref([])
const previewImageUrl = ref('')
const importing = ref(false)
const importResult = ref(null)

const stepLabels = computed(() => [
  t('dataImport.stepUpload'),
  t('dataImport.stepPreview'),
  t('dataImport.stepDone'),
])

const selectedCount = computed(() =>
  previewRows.value.filter((r) => r.selected && !r.duplicate).length
)

const formatRevenue = (amount) => {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}K`
  return String(n)
}

const downloadTemplateCsv = () => downloadImportTemplateCsv()
const downloadTemplateExcel = () => downloadImportTemplateExcel()

const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  selectedFileName.value = file.name
  parsing.value = true
  parseError.value = ''

  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }

  try {
    let raw = []
    if (sourceType.value === 'csv') {
      const parsed = await parseSpreadsheetFile(file)
      raw = parsed.rows
      resolvedSourceType.value = parsed.sourceType
    } else {
      resolvedSourceType.value = 'vision'
      previewImageUrl.value = URL.createObjectURL(file)
      raw = await parseVisionImage(file)
    }

    if (!raw.length) {
      parseError.value = t('dataImport.errorEmpty')
      return
    }

    previewRows.value = await prepareImportPreview(raw)
    step.value = 2
  } catch (err) {
    parseError.value = err?.message || t('dataImport.errorParse')
  } finally {
    parsing.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const runImport = async () => {
  importing.value = true
  try {
    importResult.value = await commitImportRows(previewRows.value, {
      sourceType: resolvedSourceType.value,
      skipDuplicates: true,
    })
    step.value = 3
  } catch (err) {
    parseError.value = err?.message || t('dataImport.errorImport')
    step.value = 2
  } finally {
    importing.value = false
  }
}

const resetWizard = () => {
  step.value = 1
  resolvedSourceType.value = 'csv'
  previewRows.value = []
  importResult.value = null
  selectedFileName.value = ''
  parseError.value = ''
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }
}
</script>
