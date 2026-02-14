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
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <!-- Panel -->
      <div
        class="relative w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right"
        :class="{ 'rounded-l-2xl': !isMobile }"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <SparklesIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900">ShifoAI</h2>
              <p class="text-xs text-gray-500">Tizim yordamchisi</p>
            </div>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Intro -->
        <div class="px-4 py-3 bg-slate-50 border-b border-gray-100">
          <p class="text-sm text-gray-600">
            Savolingizni yozing — bemor qo'shish, tashrif, to'lov, ombor, hisobot va boshqa bo'limlar bo'yicha tushuntirib beraman.
          </p>
        </div>

        <!-- Messages -->
        <div ref="messagesRef" class="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[calc(100vh-320px)]">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="[
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              ]"
            >
              <p class="whitespace-pre-wrap">{{ msg.text }}</p>
            </div>
          </div>
          <div v-if="thinking" class="flex justify-start">
            <div class="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
              <span class="animate-pulse">...</span>
              <span>Javob yozilmoqda</span>
            </div>
          </div>
        </div>

        <!-- Suggested questions (only when no messages) -->
        <div v-if="messages.length === 0" class="px-4 pb-2 flex flex-wrap gap-2">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
            @click="ask(s)"
          >
            {{ s }}
          </button>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-100 bg-white">
          <form @submit.prevent="submit" class="flex gap-2">
            <input
              v-model="inputText"
              type="text"
              :placeholder="placeholder"
              class="flex-1 min-w-0 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              :disabled="!inputText.trim() || thinking"
              class="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <PaperAirplaneIcon class="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: { type: Boolean, default: false }
})

defineEmits(['close'])

const messagesRef = ref(null)
const inputText = ref('')
const thinking = ref(false)
const messages = ref([])

const placeholder = 'Savolingizni yozing...'

const suggestions = [
  'Bemor qanday qo\'shiladi?',
  'Tashrifni qanday yakunlash?',
  'Material sarfini qanday kiritaman?',
  'Hisobotlarda nima ko\'rinadi?',
  'Qarz qanday yoziladi?'
]

// ShifoCRM bo'yicha javoblar (kalit so'zlar bo'yicha)
function getAnswer(question) {
  const q = (question || '').toLowerCase().trim()
  if (!q) return 'Savolingizni batafsilroq yozing, shunda yordam bera olaman.'

  // Salom / nima qilish
  if (/salom|hello|yordam|nima qilish|qanday ishlatish/.test(q)) {
    return 'ShifoAI — ShifoCRM tizimi yordamchisi. Bemorlar, tashriflar, to\'lovlar, ombor, hisobotlar va sozlamalar bo\'yicha savollaringizga javob beraman. Yuqoridagi qisqa savollardan birini tanlang yoki o\'zingiz yozing.'
  }

  // Bemor
  if (/bemor|patient|qo\'shish|qanday qo\'shiladi/.test(q)) {
    return 'Bemor qo\'shish: Bemorlar bo\'limiga o\'ting → "Yangi Bemor" → F.I.O, telefon, tug\'ilgan sana va ixtiyoriy ma\'lumotlarni to\'ldiring → Saqlash. Yangi bemor uchun avtomatik birinchi tashrif yaratiladi. Biriktirilgan doktor tanlashingiz mumkin.'
  }

  // Tashrif
  if (/tashrif|visit|yakunlash|complete|davolanish/.test(q)) {
    return 'Tashrif: Bemor profilida "Tashriflar" tabida tashriflarni ko\'rasiz. Tashrifni "Davolanish boshlandi" qilgach, odontogramma va material sarfini kiritishingiz mumkin. "Yakunlash" tugmasi bilan xizmat narxi va to\'langan summani kiriting; qarz qolsa "Qarzdor" bilan yakunlang.'
  }

  // Material sarfi / ombor
  if (/material|sarf|ombor|kirim|chiqim|inventory/.test(q)) {
    return 'Material sarfi: Bemor → Odontogramma tab → Tashrif tanlang (yoki "Yangi tashrif") → "Material qo\'shish" → Material va miqdorni tanlang → Saqlash. Ombordagi qoldiq avtomatik kamayadi. Ombor bo\'limida Kirim/Chiqim va Harajatlar ham bor.'
  }

  // Qarz
  if (/qarz|debt|qarzdor/.test(q)) {
    return 'Qarz: Tashrifni yakunlashda "To\'langan summa" xizmat narxidan kam bo\'lsa, qolgan qism qarzga yoziladi. Bemor keyinroq to\'lov qilganda To\'lovlar bo\'limida yoki bemor profilida to\'lov qo\'shasiz va qarz kamayadi.'
  }

  // Hisobot
  if (/hisobot|report|statistika|daromad/.test(q)) {
    return 'Hisobotlar: Hisobotlar bo\'limida tanlangan sana oralig\'ida jami to\'lovlar, qaytarimlar, sof daromad, qarzlar, ombor harajatlari, kirim/chiqim va xizmatlar bo\'yicha tushum ko\'rsatiladi. Filtrlarni to\'ldirib "Filtrni qo\'llash" bosing.'
  }

  // To'lov
  if (/to\'lov|payment|tolov/.test(q)) {
    return 'To\'lov: To\'lovlar bo\'limida barcha to\'lovlar va qaytarimlar. Bemor profilida "To\'lovlar" tabida shu bemor uchun to\'lov qo\'shish mumkin. Naqd, karta yoki o\'tkazma tanlashingiz mumkin.'
  }

  // Uchrashuv / qabul
  if (/uchrashuv|qabul|appointment|jadval/.test(q)) {
    return 'Uchrashuvlar: Uchrashuvlar bo\'limida kun/hafta/oy ko\'rinishida qabullar. Yangi uchrashuv — bemor, doktor, sana, vaqt va xizmatni tanlang. Statusni "Keldi", "Davolanish" va "Yakunlandi" ga o\'zgartirishingiz mumkin.'
  }

  // Odontogramma
  if (/odontogramma|tish|plomba|karies/.test(q)) {
    return 'Odontogramma: Bemor → Odontogramma tab → Tashrif tanlang. Tishni bosing va status (sog\'lom, karies, plomba va h.k.) yoki xizmat tanlang. Material sarfi alohida "Material qo\'shish" orqali kiritiladi.'
  }

  // Sozlamalar
  if (/sozlamalar|settings|logo|til/.test(q)) {
    return 'Sozlamalar: Sozlamalar bo\'limida klinika logotipi, nomi va tilni o\'zgartirishingiz mumkin. Shifokorlar o\'z parolini Doctor profilida o\'zgartirishi mumkin.'
  }

  // Doktor
  if (/doktor|shifokor|doctor/.test(q)) {
    return 'Doktorlar: Admin "Doktorlar" bo\'limida yangi doktor qo\'shadi (F.I.O, telefon, parol, mutaxassislik). Doktorlar telefon va parol bilan "Shifokor" tabida tizimga kiradi.'
  }

  // Telegram
  if (/telegram|bot|xabar/.test(q)) {
    return 'Telegram: Bemor profilida "Telegram xabar yuborish" tugmasi orqali bemorga xabar yuborishingiz mumkin. Bemor avval Telegram botda /register qilishi kerak. Sozlamalar TELEGRAM_INTEGRATION.md da.'
  }

  // Default
  return 'Bu mavzuda aniq ma\'lumotim yo\'q. Savolingizni boshqacha so\'zlab ko\'ring (masalan: bemor qo\'shish, tashrif, to\'lov, ombor, hisobot). Yoki "Yordam" menyusidan yoki administratorga murojaat qiling.'
}

function ask(text) {
  const question = (text || inputText.value || '').trim()
  if (!question) return
  messages.value.push({ role: 'user', text: question })
  inputText.value = ''
  thinking.value = true
  setTimeout(() => {
    const answer = getAnswer(question)
    messages.value.push({ role: 'assistant', text: answer })
    thinking.value = false
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  }, 400)
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

watch(() => props.open, (isOpen) => {
  if (isOpen && messages.value.length === 0) {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = 0
    })
  }
})
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
