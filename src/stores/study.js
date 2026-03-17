import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api'

export const useStudyStore = defineStore('study', () => {
  const myStudies = ref([])
  const publicStudies = ref([])
  const currentStudy = ref(null)
  const ranking = ref([])
  const dashboard = ref(null)

  async function fetchMyStudies() {
    try {
      const res = await apiClient.get('/studies')
      myStudies.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchPublicStudies(keyword = '') {
    try {
      const res = await apiClient.get('/studies', { params: { isPublic: true, keyword } })
      publicStudies.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchStudy(id) {
    try {
      const res = await apiClient.get(`/studies/${id}`)
      currentStudy.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchRanking(id) {
    try {
      const res = await apiClient.get(`/studies/${id}/ranking`)
      ranking.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function createStudy(payload) {
    try {
      const res = await apiClient.post('/studies', payload)
      myStudies.value.unshift(res.data.data)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '생성에 실패했습니다.' }
    }
  }

  async function joinStudy(inviteCode) {
    try {
      const res = await apiClient.post('/studies/join', { inviteCode })
      myStudies.value.unshift(res.data.data)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '참가에 실패했습니다.' }
    }
  }

  async function fetchDashboard(studyId) {
    try {
      const res = await apiClient.get(`/studies/${studyId}/dashboard`)
      dashboard.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function joinPublicStudyById(id) {
    try {
      const res = await apiClient.post(`/studies/${id}/join`)
      myStudies.value.unshift(res.data.data)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '참가에 실패했습니다.' }
    }
  }

  async function leaveStudy(id) {
    try {
      await apiClient.delete(`/studies/${id}/leave`)
      myStudies.value = myStudies.value.filter(s => s.id !== id)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '탈퇴에 실패했습니다.' }
    }
  }

  async function deleteStudy(id) {
    try {
      await apiClient.delete(`/studies/${id}`)
      myStudies.value = myStudies.value.filter(s => s.id !== id)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '삭제에 실패했습니다.' }
    }
  }

  return {
    myStudies, publicStudies, currentStudy, ranking, dashboard,
    fetchMyStudies, fetchPublicStudies, fetchStudy, fetchRanking,
    createStudy, joinStudy, joinPublicStudyById, leaveStudy, fetchDashboard, deleteStudy
  }
})
