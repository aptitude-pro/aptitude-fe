import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api'

export const useResultStore = defineStore('result', () => {
  const results = ref([])
  const currentResult = ref(null)
  const growthData = ref(null)
  const categoryData = ref(null)
  const stats = ref({ totalCount: 0, avgScore: 0, maxScore: 0, correctRate: 0 })
  const activityData = ref([])

  async function fetchResults(page = 0) {
    try {
      const res = await apiClient.get('/results', { params: { page } })
      results.value = res.data.data.content || res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchResult(id) {
    try {
      const res = await apiClient.get(`/results/${id}`)
      currentResult.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchGrowthData(examType = '') {
    try {
      const res = await apiClient.get('/stats/growth', { params: { examType } })
      growthData.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchCategoryData() {
    try {
      const res = await apiClient.get('/stats/category')
      categoryData.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchStats() {
    try {
      const res = await apiClient.get('/stats/summary')
      stats.value = res.data.data
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function saveManualResult(sessionId, categoryScores, meta = {}) {
    try {
      const values = Object.values(categoryScores)
      const totalScore = values.reduce((a, b) => a + b, 0)
      const res = await apiClient.post('/results/manual', {
        sessionId: sessionId ? Number(sessionId) : null,
        categoryScores,
        totalScore,
        examYear: meta.examYear,
        examPeriod: meta.examPeriod,
        platform: meta.platform,
        examRound: meta.examRound ?? null,
        elapsedSeconds: (meta.elapsedSeconds > 0) ? meta.elapsedSeconds : null,
        questions: meta.questions ?? [],
        isDraft: meta.isDraft ?? false
      })
      return { success: true, resultId: res.data.data.id }
    } catch (_) {
      return { success: false }
    }
  }

  async function fetchActivityData() {
    const to = new Date()
    const from = new Date()
    from.setFullYear(from.getFullYear() - 1)
    const fmt = d => d.toISOString().slice(0, 10)
    try {
      const res = await apiClient.get('/stats/activity', { params: { from: fmt(from), to: fmt(to) } })
      activityData.value = res.data.data || []
    } catch (_) {}
  }

  async function createDraft() {
    const emptyScores = Object.fromEntries(
      ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'].map(c => [c, 0])
    )
    return saveManualResult(null, emptyScores, {
      examYear: null, examPeriod: null, platform: null, examRound: null,
      elapsedSeconds: null, questions: [], isDraft: true
    })
  }

  async function saveDraftAnswers(draftId, questions, elapsedSeconds) {
    const emptyScores = Object.fromEntries(
      ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'].map(c => [c, 0])
    )
    return updateManualResult(draftId, emptyScores, {
      examYear: null, examPeriod: null, platform: null, examRound: null,
      elapsedSeconds, questions, isDraft: true
    })
  }

  async function fetchDraftCount() {
    try {
      const res = await apiClient.get('/results')
      const data = res.data.data.content || res.data.data
      return data.filter(r => r.isDraft).length
    } catch { return 0 }
  }

  async function deleteResult(id) {
    try {
      await apiClient.delete(`/results/${id}`)
      results.value = results.value.filter(r => r.id !== id)
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function updateManualResult(resultId, categoryScores, meta = {}) {
    try {
      const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0)
      const res = await apiClient.put(`/results/${resultId}/manual`, {
        categoryScores, totalScore,
        examYear: meta.examYear, examPeriod: meta.examPeriod,
        platform: meta.platform, examRound: meta.examRound ?? null,
        elapsedSeconds: (meta.elapsedSeconds > 0) ? meta.elapsedSeconds : null,
        questions: meta.questions ?? [],
        isDraft: meta.isDraft ?? false
      })
      return { success: true, resultId: res.data.data.id }
    } catch (_) { return { success: false } }
  }

  return {
    results, currentResult, growthData, categoryData, stats, activityData,
    fetchResults, fetchResult, fetchGrowthData, fetchCategoryData, fetchStats,
    fetchActivityData, saveManualResult, updateManualResult, deleteResult, fetchDraftCount,
    createDraft, saveDraftAnswers
  }
})
