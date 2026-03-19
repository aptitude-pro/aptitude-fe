import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api'

export const useStudyStore = defineStore('study', () => {
  const myStudies = ref([])
  const publicStudies = ref([])
  const currentStudy = ref(null)
  const ranking = ref([])
  const dashboard = ref(null)
  const books = ref([])
  const myLogs = ref([])
  const todaySummary = ref([])

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

  // ── Books ──

  async function fetchBooks(studyId) {
    try {
      const res = await apiClient.get(`/studies/${studyId}/books`)
      books.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function addBook(studyId, payload) {
    try {
      const res = await apiClient.post(`/studies/${studyId}/books`, payload)
      books.value.unshift(res.data.data)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '등록에 실패했습니다.' }
    }
  }

  async function deleteBook(studyId, bookId) {
    try {
      await apiClient.delete(`/studies/${studyId}/books/${bookId}`)
      books.value = books.value.filter(b => b.id !== bookId)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '삭제에 실패했습니다.' }
    }
  }

  // ── StudyLog ──

  async function fetchMyLogs(studyId, month) {
    try {
      const res = await apiClient.get(`/studies/${studyId}/logs`, { params: { month } })
      myLogs.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function upsertLog(studyId, payload) {
    try {
      const res = await apiClient.post(`/studies/${studyId}/logs`, payload)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '저장에 실패했습니다.' }
    }
  }

  async function deleteLog(studyId, logId) {
    try {
      await apiClient.delete(`/studies/${studyId}/logs/${logId}`)
      myLogs.value = myLogs.value.filter(l => l.id !== logId)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '삭제에 실패했습니다.' }
    }
  }

  async function fetchTodaySummary(studyId) {
    try {
      const res = await apiClient.get(`/studies/${studyId}/logs/today-summary`)
      todaySummary.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  return {
    myStudies, publicStudies, currentStudy, ranking, dashboard,
    books, myLogs, todaySummary,
    fetchMyStudies, fetchPublicStudies, fetchStudy, fetchRanking,
    createStudy, joinStudy, joinPublicStudyById, leaveStudy, fetchDashboard, deleteStudy,
    fetchBooks, addBook, deleteBook,
    fetchMyLogs, upsertLog, deleteLog, fetchTodaySummary
  }
})
