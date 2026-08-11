<template>
  <div class="space-y-3">
    <div v-if="options.length > 6" class="relative">
      <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        v-model.trim="query"
        type="search"
        :placeholder="t('odontogram.searchService')"
        class="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />
    </div>

    <div class="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
      <section v-for="group in optionGroups" :key="group.id">
        <h4 class="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {{ t(group.labelKey) }}
        </h4>
        <button
          v-for="option in group.options"
          :key="`${option.type}-${option.value}`"
          type="button"
          :disabled="loading"
          class="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-wait disabled:opacity-50"
          @click="$emit('select', option)"
        >
          <span class="flex min-w-0 items-center gap-3">
            <span class="h-4 w-4 flex-none rounded-full ring-2 ring-white shadow-sm" :class="option.dotClass"></span>
            <span class="truncate text-sm font-medium text-slate-800">{{ optionLabel(option) }}</span>
          </span>
          <span v-if="option.price" class="flex-none text-xs font-semibold text-primary-600">
            {{ formatCurrency(option.price) }}
          </span>
        </button>
      </section>
      <p v-if="filteredOptions.length === 0" class="py-6 text-center text-sm text-slate-500">
        {{ t('odontogram.serviceNotFound') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const { t } = useI18n()
const query = ref('')

const optionLabel = (option) => option.labelKey ? t(option.labelKey) : option.label

const filteredOptions = computed(() => {
  const normalized = query.value.toLocaleLowerCase()
  if (!normalized) return props.options
  return props.options.filter((option) =>
    optionLabel(option).toLocaleLowerCase().includes(normalized),
  )
})

const optionGroups = computed(() => [
  {
    id: 'statuses',
    labelKey: 'odontogram.statusGroup',
    options: filteredOptions.value.filter(option => option.type !== 'service'),
  },
  {
    id: 'services',
    labelKey: 'odontogram.serviceGroup',
    options: filteredOptions.value.filter(option => option.type === 'service'),
  },
].filter(group => group.options.length))
</script>
