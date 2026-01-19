<template>
  <div class="relative">
    <button
      @click="toggleMenu"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span class="text-lg">{{ currentFlag }}</span>
      <span class="hidden sm:inline">{{ currentLocale.toUpperCase() }}</span>
      <ChevronDownIcon class="w-4 h-4" />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="menuOpen"
        ref="menuRef"
        class="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      >
        <button
          @click="switchLocale('uz')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          :class="{ 'bg-blue-50 text-blue-600': currentLocale === 'uz' }"
        >
          <span>🇺🇿</span>
          <span>O'zbek</span>
        </button>
        <button
          @click="switchLocale('ru')"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          :class="{ 'bg-blue-50 text-blue-600': currentLocale === 'ru' }"
        >
          <span>🇷🇺</span>
          <span>Русский</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useI18nStore } from '@/stores/i18n'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const i18nStore = useI18nStore()

const menuOpen = ref(false)
const menuRef = ref(null)

const currentLocale = computed(() => locale.value)
const currentFlag = computed(() => {
  return locale.value === 'uz' ? '🇺🇿' : '🇷🇺'
})

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const switchLocale = (newLocale) => {
  i18nStore.setLocale(newLocale)
  closeMenu()
}

// Click outside handler
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    const button = event.target.closest('button')
    if (!button || !button.closest('.relative')) {
      closeMenu()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
