<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex-1">
          <label class="text-sm font-medium text-slate-700">{{ t('patientDocuments.titleLabel') }}</label>
          <input
            v-model="title"
            type="text"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            :placeholder="t('patientDocuments.titlePlaceholder')"
          />
        </div>
        <div class="flex items-center gap-3">
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange"
          />
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="openFilePicker"
          >
            {{ t('patientDocuments.selectFile') }}
          </button>
          <button
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            :disabled="uploading || !selectedFile"
            @click="saveDocument"
          >
            {{ uploading ? t('patientDocuments.uploading') : t('patientDocuments.save') }}
          </button>
        </div>
      </div>
      <p class="mt-2 text-xs text-slate-500">
        {{ t('patientDocuments.hint') }}
      </p>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientDocuments.document') }}</th>
            <th class="px-4 py-3">{{ t('patientDocuments.date') }}</th>
            <th class="px-4 py-3">{{ t('patientDocuments.size') }}</th>
            <th class="px-4 py-3 text-right">{{ t('patientDocuments.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="documents.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="4">{{ t('patientDocuments.noDocuments') }}</td>
          </tr>
          <tr v-for="doc in documents" :key="doc.id" class="bg-white">
            <td class="px-4 py-3">
              <div class="font-medium text-slate-800">{{ doc.title || doc.name }}</div>
              <div class="text-xs text-slate-500">{{ doc.name }}</div>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ formatDate(doc.createdAt) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ formatSize(doc.size) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <a
                  class="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  :href="doc.dataUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ t('patientDocuments.view') }}
                </a>
                <a
                  class="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  :href="doc.dataUrl"
                  :download="doc.name"
                >
                  {{ t('patientDocuments.download') }}
                </a>
                <button
                  class="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  @click="removeDocument(doc.id)"
                >
                  {{ t('patientDocuments.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const toast = useToast()
const { t } = useI18n()
const documents = ref([])
const title = ref('')
const selectedFile = ref(null)
const uploading = ref(false)
const fileInputRef = ref(null)

const storageKey = () => `patient-documents-${props.patientId}`

const loadDocuments = () => {
  const raw = localStorage.getItem(storageKey())
  documents.value = raw ? JSON.parse(raw) : []
}

const persistDocuments = () => {
  localStorage.setItem(storageKey(), JSON.stringify(documents.value))
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('uz-UZ')
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    toast.error(t('patientDocuments.errorFileTooLarge'))
    event.target.value = ''
    return
  }
  selectedFile.value = file
}

const saveDocument = async () => {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const dataUrl = await readFileAsDataUrl(selectedFile.value)
    documents.value.unshift({
      id: Date.now(),
      name: selectedFile.value.name,
      size: selectedFile.value.size,
      type: selectedFile.value.type,
      title: title.value.trim(),
      dataUrl,
      createdAt: new Date().toISOString()
    })
    persistDocuments()
    title.value = ''
    selectedFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    toast.success(t('patientDocuments.toastSaved'))
  } catch (error) {
    console.error('Failed to save document:', error)
    toast.error(t('patientDocuments.errorSave'))
  } finally {
    uploading.value = false
  }
}

const removeDocument = (id) => {
  documents.value = documents.value.filter((doc) => doc.id !== id)
  persistDocuments()
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

onMounted(loadDocuments)
watch(() => props.patientId, loadDocuments)
</script>
