<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" aria-hidden="true" />

      <div
        class="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-slide-in-right"
        :class="{ 'rounded-l-2xl': !isMobile }"
        role="dialog"
        aria-labelledby="shifoai-title"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white px-4 py-3">
          <div class="flex min-w-0 items-center gap-2">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500">
              <SparklesIcon class="h-5 w-5 text-white" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 id="shifoai-title" class="truncate text-base font-semibold text-gray-900">
                  {{ t('shifoAI.title') }}
                </h2>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  :class="onlineMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ onlineMode ? t('shifoAI.modeOnline') : t('shifoAI.modeLocal') }}
                </span>
              </div>
              <p class="truncate text-xs text-gray-500">{{ t('shifoAI.subtitle') }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              v-if="messages.length > 0"
              type="button"
              class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              :title="t('shifoAI.clearChat')"
              @click="clearChat"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              :title="t('shifoAI.close')"
              @click="$emit('close')"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Intro -->
        <div class="shrink-0 border-b border-gray-100 bg-slate-50 px-4 py-3">
          <p class="text-sm text-gray-600">{{ t('shifoAI.intro') }}</p>
          <p v-if="pageHint" class="mt-1 text-xs text-primary-700">
            {{ t('shifoAI.contextHint', { page: pageHint }) }}
          </p>
        </div>

        <!-- Messages -->
        <div ref="messagesRef" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="[
                'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-br-md bg-primary-500 text-white'
                  : 'rounded-bl-md bg-gray-100 text-gray-800',
              ]"
            >
              <p class="whitespace-pre-wrap">{{ msg.text }}</p>
            </div>
          </div>

          <div v-if="thinking" class="flex justify-start">
            <div class="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-sm text-gray-600">
              <span class="inline-flex gap-1">
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.2s]" />
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.1s]" />
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" />
              </span>
              <span>{{ t('shifoAI.thinking') }}</span>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions.length" class="shrink-0 border-t border-gray-50 px-4 py-2">
          <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {{ t('shifoAI.suggestionsLabel') }}
          </p>
          <div class="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
            <button
              v-for="s in suggestions"
              :key="s"
              type="button"
              class="rounded-full bg-primary-50 px-3 py-1.5 text-xs text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
              :disabled="thinking"
              @click="ask(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Input -->
        <div class="shrink-0 border-t border-gray-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form class="flex items-end gap-2" @submit.prevent="submit">
            <textarea
              ref="inputRef"
              v-model="inputText"
              rows="1"
              :placeholder="placeholder"
              :disabled="thinking"
              class="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              @keydown.enter.exact.prevent="submit"
            />
            <button
              type="submit"
              :disabled="!inputText.trim() || thinking"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              :title="t('shifoAI.send')"
            >
              <PaperAirplaneIcon class="h-5 w-5" />
            </button>
          </form>
          <p class="mt-2 text-[11px] text-gray-400">{{ t('shifoAI.disclaimer') }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { getRoleLabel, getDisplayUserName } from '@/lib/roles'
import { chatWithShifoAI, isShifoAIOnline } from '@/api/shifoAIApi'
import { resolveLocalAnswer } from '@/lib/shifoAI/localAnswers'

const props = defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const route = useRoute()
const authStore = useAuthStore()
const { t, tm, locale } = useI18n()

const messagesRef = ref(null)
const inputRef = ref(null)
const inputText = ref('')
const thinking = ref(false)
const messages = ref([])
const welcomed = ref(false)

const onlineMode = computed(() => isShifoAIOnline())
const placeholder = computed(() => t('shifoAI.placeholder'))
const suggestions = computed(() => {
  const list = tm('shifoAI.suggestions')
  return Array.isArray(list) ? list : []
})

const pageHint = computed(() => {
  const path = route.path || ''
  if (path.startsWith('/patients')) return t('shifoAI.pages.patients')
  if (path.startsWith('/appointments')) return t('shifoAI.pages.appointments')
  if (path.startsWith('/leads')) return t('shifoAI.pages.leads')
  if (path.startsWith('/payments')) return t('shifoAI.pages.payments')
  if (path.startsWith('/staff') || path.startsWith('/doctors')) return t('shifoAI.pages.staff')
  if (path.startsWith('/dashboard')) return t('shifoAI.pages.dashboard')
  if (path.startsWith('/settings')) return t('shifoAI.pages.settings')
  return ''
})

const aiContext = computed(() => ({
  locale: locale.value,
  userRole: getRoleLabel(authStore, t),
  userName: getDisplayUserName(authStore, t) || authStore.user?.full_name || '',
  pageTitle: pageHint.value,
  routePath: route.path,
}))

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function pushWelcome() {
  if (welcomed.value) return
  messages.value.push({
    role: 'assistant',
    text: t('shifoAI.answers.welcome'),
  })
  welcomed.value = true
  scrollToBottom()
}

function clearChat() {
  messages.value = []
  welcomed.value = false
  pushWelcome()
}

async function ask(text) {
  const question = (text || inputText.value || '').trim()
  if (!question || thinking.value) return

  messages.value.push({ role: 'user', text: question })
  inputText.value = ''
  thinking.value = true
  scrollToBottom()

  try {
    let answer = ''

    if (onlineMode.value) {
      try {
        answer = await chatWithShifoAI({
          messages: messages.value,
          context: aiContext.value,
        })
      } catch (apiError) {
        if (apiError?.code !== 'SHIFOAI_OFFLINE') {
          console.warn('ShifoAI API fallback:', apiError?.message)
        }
        answer = resolveLocalAnswer(question, t)
        if (apiError?.code === 'SHIFOAI_API_ERROR') {
          answer = `${answer}\n\n(${t('shifoAI.fallbackNote')})`
        }
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 350))
      answer = resolveLocalAnswer(question, t)
    }

    messages.value.push({ role: 'assistant', text: answer })
  } catch (error) {
    console.error('ShifoAI error:', error)
    messages.value.push({
      role: 'assistant',
      text: t('shifoAI.errorGeneric'),
    })
  } finally {
    thinking.value = false
    scrollToBottom()
    nextTick(() => inputRef.value?.focus())
  }
}

function submit() {
  ask(inputText.value)
}

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (messages.value.length === 0) pushWelcome()
      nextTick(() => inputRef.value?.focus())
    }
  },
)
</script>

<style scoped>
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-slide-in-right {
  animation: slide-in-right 0.2s ease-out;
}
</style>
