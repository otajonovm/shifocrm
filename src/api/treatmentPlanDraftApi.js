/**
 * Davolash rejasi draft — AI hujjatlashtirish yordamchisi (tashxis emas).
 */

import { chatWithShifoAI, isShifoAIOnline } from '@/api/shifoAIApi'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { clinicHasActiveFeature } from '@/services/subscriptionService'
import { FEATURE_KEYS } from '@/lib/subscriptionFeatures'

const DRAFT_SYSTEM = `Siz stomatologik klinika hujjatlashtirish yordamchisisiz.
MUHIM: Tashxis qo'ymang, faqat hujjatlashtirish va reja DRAFTini taklif qiling.
Har doim "Shifokor tasdiqlashi kerak" deb eslatib o'ting.
Javob o'zbek tilida, qisqa bandlar bilan.`

export const generateTreatmentPlanDraft = async ({
  patientName = 'Bemor',
  toothSummary = '',
  odontogramNotes = '',
  locale = 'uz',
} = {}) => {
  const context = [
    `Bemor: ${patientName}`,
    toothSummary ? `Tish holati: ${toothSummary}` : null,
    odontogramNotes ? `Qo'shimcha: ${odontogramNotes}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `${DRAFT_SYSTEM}\n\n${context}\n\nDavolash rejasi DRAFTini 3-6 bosqichda yozing (xizmat nomi, tish raqami, taxminiy tartib).`

  const clinicId = await getCurrentClinicId()
  const shifoAiEnabled = await clinicHasActiveFeature(clinicId, FEATURE_KEYS.SHIFO_AI)
  if (!shifoAiEnabled) {
    return {
      draft: null,
      source: 'locked',
      disclaimer: 'ShifoAI moduli faol emas. Premium modulni yoqing.',
      error: 'feature_locked',
    }
  }

  if (!isShifoAIOnline()) {
    return buildOfflineDraft(patientName, toothSummary)
  }

  try {
    const text = await chatWithShifoAI({
      messages: [{ role: 'user', text: prompt }],
      context: { locale },
    })
    return {
      draft: text,
      source: 'ai',
      disclaimer: 'Shifokor tasdiqlashi shart. AI tashxis qo\'ymaydi.',
    }
  } catch {
    return buildOfflineDraft(patientName, toothSummary)
  }
}

const buildOfflineDraft = (patientName, toothSummary) => ({
  draft: `1. ${patientName} — konsultatsiya va rengen ko'rib chiqish\n2. ${toothSummary || 'Muammoli tishlar'} — davolash bosqichlari\n3. Gigiyena va profilaktika\n\n⚠️ Shifokor tasdiqlashi kerak.`,
  source: 'offline',
  disclaimer: 'ShifoAI offline — shablon draft.',
})

export const summarizeOdontogramForDraft = (odontogramData) => {
  const teeth = odontogramData?.teeth || {}
  const parts = []
  for (const [id, tooth] of Object.entries(teeth)) {
    if (!tooth || tooth.state === 'healthy') continue
    parts.push(`Tish ${id}: ${tooth.state}${tooth.note ? ` (${tooth.note})` : ''}`)
  }
  return parts.length ? parts.join('; ') : 'Barcha tishlar sog\'lom deb belgilangan'
}
