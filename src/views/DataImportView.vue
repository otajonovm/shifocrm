<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in pb-6 pb-safe max-w-6xl mx-auto">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('dataImport.title') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('dataImport.subtitle') }}</p>
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
            @click="downloadTemplate"
          >
            {{ t('dataImport.downloadTemplate') }}
          </button>
        </div>

        <div>
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            :accept="sourceType === 'csv' ? '.csv,.txt' : 'image/*'"
            @change="onFileSelected"
          />
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            :disabled="parsing"
            @click="fileInputRef?.click()"
          >
            <ArrowUpTrayIcon class="w-5 h-5" />
            {{ parsing ? t('dataImport.parsing') : t('dataImport.selectFile') }}
          </button>
          <p v-if="selectedFileName" class="mt-2 text-sm text-gray-600">{{ selectedFileName }}</p>
        </div>

        <p v-if="parseError" class="text-sm text-rose-600">{{ parseError }}</p>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="step === 2" class="space-y-4">
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

        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-xl bg-emerald-50 p-4 text-center">
            <p class="text-2xl font-bold text-emerald-700">{{ importResult?.imported ?? 0 }}</p>
            <p class="text-xs text-emerald-800">{{ t('dataImport.imported') }}</p>
          </div>
          <div class="rounded-xl bg-rose-50 p-4 text-center">
            <p class="text-2xl font-bold text-rose-700">{{ importResult?.failed ?? 0 }}</p>
            <p class="text-xs text-rose-800">{{ t('dataImport.failed') }}</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-4 text-center">
            <p class="text-2xl font-bold text-gray-700">{{ importResult?.skipped ?? 0 }}</p>
            <p class="text-xs text-gray-600">{{ t('dataImport.skipped') }}</p>
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
  parseCsvFile,
  parseVisionImage,
  prepareImportPreview,
  commitImportRows,
  downloadImportTemplateCsv,
} from '@/api/dataImportApi'
import {
  ArrowUpTrayIcon,
  CameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()

const step = ref(1)
const sourceType = ref('csv')
const fileInputRef = ref(null)
const selectedFileName = ref('')
const parsing = ref(false)
const parseError = ref('')
const previewRows = ref([])
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

const downloadTemplate = () => downloadImportTemplateCsv()

const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  selectedFileName.value = file.name
  parsing.value = true
  parseError.value = ''

  try {
    let raw = []
    if (sourceType.value === 'csv') {
      raw = await parseCsvFile(file)
    } else {
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
      sourceType: sourceType.value,
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
  previewRows.value = []
  importResult.value = null
  selectedFileName.value = ''
  parseError.value = ''
}
</script>
