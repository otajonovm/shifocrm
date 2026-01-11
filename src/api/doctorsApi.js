import { supabase } from '@/lib/supabaseClient'

export const listDoctors = async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const createDoctor = async ({ full_name, phone, is_active = true }) => {
  const { data, error } = await supabase
    .from('doctors')
    .insert([
      {
        full_name,
        phone,
        is_active,
      }
    ])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateDoctor = async (id, payload) => {
  const { data, error } = await supabase
    .from('doctors')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteDoctor = async (id) => {
  const { error } = await supabase
    .from('doctors')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
