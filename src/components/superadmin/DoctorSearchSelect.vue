<template>
  <div ref="rootEl" class="relative">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ t('doctorBots.doctor') }} *
    </label>
    <input
      v-model="query"
      type="search"
      :disabled="disabled"
      autocomplete="off"
      class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
      :placeholder="t('doctorBots.doctorSearchPlaceholder')"
      @focus="open = true"
      @input="open = true"
    />
    <p v-if="selected" class="mt-1 text-xs text-gray-500">
      {{ selected.full_name }}
      <span v-if="selected.clinic_name"> · {{ selected.clinic_name }}</span>
    </p>
    <div
      v-if="open && !disabled"
      class="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      <button
        v-for="doc in filtered"
        :key="doc.id"
        type="button"
        class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
        :class="String(modelValue) === String(doc.id) ? 'bg-primary-50 text-primary-800' : 'text-gray-800'"
        @click="pick(doc)"
      >
        <span class="font-medium">{{ doc.full_name }}</span>
        <span class="block text-xs text-gray-500">
          {{ doc.clinic_name || t('doctorBots.unknownClinic') }}
          <span v-if="doc.specialization"> · {{ doc.specialization }}</span>
        </span>
      </button>
      <p v-if="!filtered.length" class="px-3 py-2 text-sm text-gray-500">
        {{ t('doctorBots.noDoctors') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  doctors: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const { t } = useI18n()
const query = ref('')
const open = ref(false)
const rootEl = ref(null)

const selected = computed(() =>
  (props.doctors || []).find((d) => String(d.id) === String(props.modelValue)) || null,
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = props.doctors || []
  if (!q) return list.slice(0, 40)
  return list
    .filter((d) => {
      const hay = `${d.full_name || ''} ${d.clinic_name || ''} ${d.specialization || ''} ${d.id}`.toLowerCase()
      return hay.includes(q)
    })
    .slice(0, 40)
})

watch(selected, (doc) => {
  if (doc && !open.value) query.value = doc.full_name || ''
}, { immediate: true })

function pick(doc) {
  emit('update:modelValue', doc.id)
  emit('select', doc)
  query.value = doc.full_name || ''
  open.value = false
}

function onDocClick(event) {
  if (rootEl.value && !rootEl.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>
