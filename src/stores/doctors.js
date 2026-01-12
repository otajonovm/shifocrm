import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as doctorsApi from '@/api/doctorsApi'
import { MAX_DOCTORS_LIMIT, MESSAGES } from '@/constants'

export const useDoctorsStore = defineStore('doctors', () => {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      items.value = await doctorsApi.listDoctors()
    } catch (err) {
      error.value = err.message || MESSAGES.DOCTORS.FETCH_ERROR
      console.error('Error fetching doctors:', err)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (payload) => {
    if (items.value.length >= MAX_DOCTORS_LIMIT) {
      error.value = MESSAGES.DOCTORS.MAX_LIMIT_REACHED
      throw new Error(MESSAGES.DOCTORS.MAX_LIMIT_REACHED)
    }

    error.value = null
    try {
      const newDoctor = await doctorsApi.createDoctor(payload)
      items.value.unshift(newDoctor)
      return newDoctor
    } catch (err) {
      error.value = err.message || MESSAGES.DOCTORS.CREATE_ERROR
      throw err
    }
  }

  const update = async (id, payload) => {
    error.value = null
    try {
      const updated = await doctorsApi.updateDoctor(id, payload)
      const index = items.value.findIndex(d => d.id === id)
      if (index !== -1) {
        items.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err.message || MESSAGES.DOCTORS.UPDATE_ERROR
      throw err
    }
  }

  const remove = async (id) => {
    error.value = null
    try {
      await doctorsApi.deleteDoctor(id)
      items.value = items.value.filter(d => d.id !== id)
    } catch (err) {
      error.value = err.message || MESSAGES.DOCTORS.DELETE_ERROR
      throw err
    }
  }

  return { items, isLoading, error, fetchAll, create, update, remove }
})
