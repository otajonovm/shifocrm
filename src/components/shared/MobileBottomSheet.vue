<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="mobile-backdrop"
        @click.self="handleClose"
        @touchmove.prevent
      >
        <div
          class="mobile-modal"
          :class="{ 'animate-slide-up-mobile': modelValue }"
        >
          <!-- Handle bar for drag indication -->
          <div
            class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          <!-- Header -->
          <div
            v-if="title"
            class="flex items-center justify-between px-4 sm:px-6 pb-4 border-b border-gray-100"
          >
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button
              @click="handleClose"
              class="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg touch-manipulation touch-target"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-4 sm:px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <slot />
          </div>

          <!-- Footer (optional) -->
          <div
            v-if="$slots.footer"
            class="sticky bottom-0 px-4 sm:px-6 py-4 bg-white border-t border-gray-100 safe-bottom"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)

const handleClose = () => {
  if (props.closeOnBackdrop) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  touchCurrentY.value = e.touches[0].clientY
  const diff = touchCurrentY.value - touchStartY.value
  
  // Only allow downward drag
  if (diff > 0) {
    const sheet = e.currentTarget.closest('.mobile-modal')
    if (sheet) {
      sheet.style.transform = `translateY(${Math.min(diff, 100)}px)`
    }
  }
}

const handleTouchEnd = (e) => {
  if (!isDragging.value) return
  isDragging.value = false
  
  const diff = touchCurrentY.value - touchStartY.value
  const sheet = e.currentTarget.closest('.mobile-modal')
  
  if (sheet) {
    sheet.style.transform = ''
  }
  
  // Close if dragged down more than 100px
  if (diff > 100) {
    handleClose()
  }
}

// Prevent body scroll when sheet is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})
</script>

