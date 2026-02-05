/**
 * Umumiy funksiya: bemorning barcha tashriflarini yakunlash
 * Xizmatlar va materiallar bo'yicha hisoblab, to'lov yozadi va tashriflarni yakunlaydi
 */

import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import { getVisitServicesByVisitId, getVisitServicesByPatientId } from '@/api/visitServicesApi'
import { getVisitById, updateVisit, getVisitsByPatientId } from '@/api/visitsApi'
import { listInventoryConsumptionsByVisitId, listInventoryItems } from '@/api/inventoryApi'

const parsePrice = (v) => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

const getItemPrice = (itemId, inventoryItems) => {
  const match = inventoryItems.find(item => Number(item.id) === Number(itemId))
  return match ? (Number(match.cost_price) || 0) : 0
}

// Bitta tashrif uchun xizmatlar yig'indisi
const getVisitServicesTotal = (visitId, services) => {
  const byVisit = services.filter(s => Number(s.visit_id) === Number(visitId))
  if (!byVisit.length) return 0

  const seen = new Set()
  let sum = 0
  const sorted = [...byVisit].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  for (const e of sorted) {
    const tid = e.tooth_id
    if (tid == null) continue
    const key = `t${tid}`
    if (seen.has(key)) continue
    seen.add(key)
    sum += parsePrice(e.price)
  }
  return sum
}

// Bitta tashrif uchun material sarfi yig'indisi
const getVisitConsumptionsTotal = async (visitId, inventoryItems) => {
  try {
    const consumptions = await listInventoryConsumptionsByVisitId(visitId)
    return consumptions.reduce((sum, entry) => {
      const qty = Number(entry.quantity) || 0
      const price = getItemPrice(entry.item_id, inventoryItems)
      return sum + qty * price
    }, 0)
  } catch (error) {
    console.error('Failed to load consumptions for visit:', error)
    return 0
  }
}

/**
 * Bemorning barcha tashriflarini yakunlash
 * @param {number} patientId - Bemor ID
 * @param {number|null} doctorId - Doktor ID (ixtiyoriy)
 * @returns {Promise<{success: boolean, completed: number, error?: string}>}
 */
export const completeAllPatientVisits = async (patientId, doctorId = null) => {
  try {
    // Ma'lumotlarni yuklash
    const [visits, services, inventoryItems] = await Promise.all([
      getVisitsByPatientId(patientId),
      getVisitServicesByPatientId(patientId),
      listInventoryItems('order=created_at.desc')
    ])

    // Yakunlanmagan tashriflarni topish
    let visitsToComplete = visits.filter(v => 
      v.status === 'in_progress' || 
      v.status === 'completed_debt' ||
      (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
    )

    // Agar yakunlanmagan tashriflar bo'lmasa, lekin xizmatlar mavjud bo'lsa
    if (visitsToComplete.length === 0) {
      const visitIdsWithServices = [...new Set(services.map(s => s.visit_id).filter(Boolean))]
      visitsToComplete = visits.filter(v => visitIdsWithServices.includes(Number(v.id)))
    }

    if (visitsToComplete.length === 0) {
      return { success: true, completed: 0, message: 'Yakunlash kerak bo\'lgan tashriflar topilmadi' }
    }

    let completedCount = 0

    for (const visit of visitsToComplete) {
      const visitId = visit.id

      // Xizmatlar yig'indisini hisoblash
      let servicesTotal = getVisitServicesTotal(visitId, services)
      if (!servicesTotal) {
        try {
          const fresh = await getVisitServicesByVisitId(visitId)
          services.push(...fresh)
          servicesTotal = getVisitServicesTotal(visitId, services)
        } catch (err) {
          console.warn('Failed to refresh visit services for visit', visitId, err)
        }
      }

      // Material sarfi yig'indisini hisoblash
      const consumptionsTotal = await getVisitConsumptionsTotal(visitId, inventoryItems)
      const totalPrice = servicesTotal + consumptionsTotal

      // Agar narx mavjud bo'lmasa, eski price'dan foydalanamiz
      const finalPrice = totalPrice > 0 ? totalPrice : (Number(visit.price) || 0)

      // Mavjud to'lovlarni tekshiramiz
      let netPaid = 0
      try {
        const existingPayments = await getPaymentsByVisitId(visitId)
        netPaid = existingPayments.reduce((sum, entry) => {
          const amount = Number(entry.amount) || 0
          return sum + (entry.payment_type === 'refund' ? -amount : amount)
        }, 0)
      } catch (err) {
        console.warn('Failed to load payments for visit', visitId, err)
      }

      // Agar to'lov yetarli bo'lmasa, avtomatik to'lov yozamiz
      const targetPrice = finalPrice
      if (targetPrice > 0 && netPaid < targetPrice) {
        try {
          await createPayment({
            visit_id: visitId,
            patient_id: Number(patientId),
            doctor_id: doctorId || visit.doctor_id || null,
            amount: targetPrice - netPaid,
            payment_type: 'payment',
            method: 'cash',
            note: 'Yakunlash orqali avtomatik to\'lov'
          })
          netPaid = targetPrice
        } catch (err) {
          console.error('Failed to create auto payment for visit', visitId, err)
        }
      }

      // Tashrifni yakunlash
      await updateVisit(visitId, {
        status: 'completed_paid',
        price: targetPrice || null,
        paid_amount: netPaid || targetPrice || null,
        debt_amount: null
      })

      completedCount++
    }

    return { success: true, completed: completedCount }
  } catch (error) {
    console.error('Failed to complete patient visits:', error)
    return { success: false, completed: 0, error: error.message || 'Xatolik yuz berdi' }
  }
}
