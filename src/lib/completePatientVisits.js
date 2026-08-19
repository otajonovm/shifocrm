/**
 * Bemorning barcha tashriflarini yakunlash.
 * To‘lov yozmaydi — faqat xizmatlar asosida debt/paid holatini hisoblaydi.
 * Material tannarxi (COGS) bemor hisobiga qo‘shilmaydi.
 */

import { getPaymentsByVisitId } from '@/api/paymentsApi'
import { getVisitServicesByVisitId, getVisitServicesByPatientId } from '@/api/visitServicesApi'
import { updateVisit, getVisitsByPatientId } from '@/api/visitsApi'
import { updatePatient } from '@/api/patientsApi'
import {
  isDiscountEntry,
  parsePrice,
  visitDueFrom,
} from '@/lib/paymentTotals'

/**
 * Bemorning barcha tashriflarini yakunlash
 * @param {number} patientId
 * @param {number|null} doctorId
 * @returns {Promise<{success: boolean, completed: number, error?: string, message?: string}>}
 */
export const completeAllPatientVisits = async (patientId, doctorId = null) => {
  try {
    const [visits, services] = await Promise.all([
      getVisitsByPatientId(patientId),
      getVisitServicesByPatientId(patientId),
    ])

    let visitsToComplete = visits.filter(v =>
      v.status === 'in_progress' ||
      v.status === 'completed_debt' ||
      (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
    )

    if (visitsToComplete.length === 0) {
      return { success: true, completed: 0, message: 'Yakunlash kerak bo\'lgan tashriflar topilmadi' }
    }

    let completedCount = 0
    const allServicesDetailed = []
    const allDiscountsDetailed = []
    let totalBeforeDiscount = 0
    let totalDiscount = 0
    let totalPaid = 0
    let totalRemaining = 0
    let summaryDoctorName = ''
    let summaryVisitDate = ''

    for (const visit of visitsToComplete) {
      const visitId = visit.id
      summaryDoctorName = summaryDoctorName || visit.doctor_name || ''
      summaryVisitDate = summaryVisitDate || visit.date || ''

      let visitServices = services.filter(s => Number(s.visit_id) === Number(visitId))
      if (!visitServices.length) {
        try {
          const freshServices = await getVisitServicesByVisitId(visitId)
          services.push(...freshServices)
          visitServices = freshServices
        } catch (error) {
          console.warn('Failed to refresh visit services for visit', visitId, error)
        }
      }

      const seenTeeth = new Set()
      const sortedServices = [...visitServices].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      )
      for (const entry of sortedServices) {
        const toothId = entry.tooth_id
        if (toothId == null) continue
        const key = `t${toothId}`
        if (seenTeeth.has(key)) continue
        seenTeeth.add(key)
        allServicesDetailed.push({
          visitId,
          name: entry.service_name || 'Xizmat',
          price: parsePrice(entry.price),
          tooth: toothId
        })
      }

      let existingPayments = []
      try {
        existingPayments = await getPaymentsByVisitId(visitId)
      } catch (error) {
        console.warn('Failed to load payments for visit', visitId, error)
      }

      const ledger = visitDueFrom({
        services: visitServices,
        visitPrice: visit.price,
        payments: existingPayments,
      })
      totalBeforeDiscount += ledger.price
      totalDiscount += ledger.discount
      totalPaid += ledger.paid
      totalRemaining += ledger.remaining

      for (const discountEntry of existingPayments.filter(isDiscountEntry)) {
        allDiscountsDetailed.push({
          visitId,
          amount: Math.abs(Number(discountEntry.amount) || 0),
          note: discountEntry.note ? String(discountEntry.note).replace(/^\s*\[DISCOUNT\]\s*/i, '').trim() : ''
        })
      }

      await updateVisit(visitId, {
        status: ledger.remaining > 0 ? 'completed_debt' : 'completed_paid',
        price: ledger.price || null,
        paid_amount: ledger.paid || 0,
        debt_amount: ledger.remaining > 0 ? ledger.remaining : null
      })

      completedCount++
    }

    try {
      await updatePatient(patientId, { status: 'completed' })
    } catch (error) {
      console.warn('Failed to update patient status:', error)
    }

    return {
      success: true,
      completed: completedCount,
      summary: {
        patientId: Number(patientId),
        doctorName: summaryDoctorName,
        visitDate: summaryVisitDate,
        services: allServicesDetailed,
        discounts: allDiscountsDetailed,
        totalBeforeDiscount,
        totalDiscount,
        totalAfterDiscount: Math.max(0, totalBeforeDiscount - totalDiscount),
        paid: totalPaid,
        remaining: totalRemaining
      }
    }
  } catch (error) {
    console.error('Failed to complete patient visits:', error)
    return { success: false, completed: 0, error: error.message || 'Xatolik yuz berdi' }
  }
}
