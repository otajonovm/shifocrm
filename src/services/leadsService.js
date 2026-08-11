import {
  listLeadsByClinic,
  listLeadsByDoctor,
  updateLeadStatus,
  convertLeadToBooked,
  convertLeadToQabulda,
} from '@/api/leadsApi'
import { isSolo } from '@/lib/roles'
import { findDoctorForSoloClinic } from '@/services/adminService'

export async function resolveSoloDoctorId(authStore) {
  const direct = Number(authStore.user?.id)
  const clinicId = Number(authStore.userClinicId ?? authStore.user?.clinic_id)
  if (isSolo(authStore) && Number.isFinite(clinicId)) {
    const doctor = await findDoctorForSoloClinic(
      clinicId,
      authStore.user?.login || authStore.userEmail || '',
    )
    if (doctor?.id) return Number(doctor.id)
  }
  return Number.isFinite(direct) && direct > 0 ? direct : null
}

export async function listInboxLeads(authStore) {
  const clinicId = Number(authStore.userClinicId || authStore.user?.clinic_id)

  if (isSolo(authStore)) {
    if (Number.isFinite(clinicId)) {
      return listLeadsByClinic(clinicId)
    }
    const doctorId = await resolveSoloDoctorId(authStore)
    return Number.isFinite(doctorId) ? listLeadsByDoctor(doctorId) : []
  }

  if (authStore.userRole === 'doctor') {
    const doctorId = Number(authStore.user?.id)
    return Number.isFinite(doctorId) ? listLeadsByDoctor(doctorId) : []
  }

  return Number.isFinite(clinicId) ? listLeadsByClinic(clinicId) : []
}

export async function changeLeadStatus(lead, status) {
  const leadId = Number(lead?.id)
  if (!Number.isFinite(leadId)) {
    return { lead: null }
  }
  if (status === 'booked') {
    return convertLeadToBooked(lead)
  }
  if (status === 'qabulda') {
    return convertLeadToQabulda(lead)
  }
  return { lead: await updateLeadStatus(leadId, status) }
}
