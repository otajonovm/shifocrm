import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as doctorsApi from '@/api/doctorsApi'
import { createCachedListLoader, upsertById } from '@/lib/staleWhileRevalidate'

export const useDoctorsStore = defineStore('doctors', () => {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const cache = createCachedListLoader({ items, loading: isLoading, error })

  const fetchAll = async (options = {}) => {
    return cache.fetchCached(() => doctorsApi.listDoctors(), { ...options, scope: 'all' })
  }

  const create = async (payload) => {
    error.value = null
    try {
      const newDoctor = await doctorsApi.createDoctor(payload)
      cache.bumpEpoch()
      if (newDoctor) upsertById(items, newDoctor)
      return newDoctor
    } catch (err) {
      error.value = err.message || 'Failed to create doctor'
      throw err
    }
  }

  const update = async (id, payload) => {
    error.value = null
    try {
      const updated = await doctorsApi.updateDoctor(id, payload)
      cache.bumpEpoch()
      if (updated) upsertById(items, updated)
      return updated
    } catch (err) {
      error.value = err.message || 'Failed to update doctor'
      throw err
    }
  }

  const getById = async (id) => {
    error.value = null
    try {
      if (!id) return null
      const cached = items.value.find((d) => Number(d.id) === Number(id))
      if (cached) {
        doctorsApi.getDoctorById(id).then((fresh) => {
          if (fresh) upsertById(items, fresh)
        }).catch(() => {})
        return cached
      }
      return await doctorsApi.getDoctorById(id)
    } catch (err) {
      error.value = err.message || 'Failed to get doctor'
      throw err
    }
  }

  const remove = async (id) => {
    error.value = null
    try {
      await doctorsApi.deleteDoctor(id)
      cache.bumpEpoch()
      items.value = items.value.filter(d => Number(d.id) !== Number(id))
    } catch (err) {
      error.value = err.message || 'Failed to delete doctor'
      throw err
    }
  }

  const reset = () => cache.reset()

  return { items, isLoading, error, fetchAll, create, update, remove, getById, reset }
})
