const { supabase } = require('../supabase')

async function getPatientById(patientId) {
  if (patientId == null || patientId === '') return null

  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, phone, clinic_id')
    .eq('id', Number(patientId))
    .maybeSingle()

  if (error) {
    throw new Error(`getPatientById failed: ${error.message}`)
  }

  return data || null
}

module.exports = {
  getPatientById,
}
