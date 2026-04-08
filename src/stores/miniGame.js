import { defineStore } from 'pinia'
import apiClient from '@/api'

export const useMiniGameStore = defineStore('miniGame', () => {
  async function submitScore(score, correctCount, totalCount) {
    try {
      const res = await apiClient.post('/mini-game/scores', { score, correctCount, totalCount })
      return { success: true, ...res.data.data }
    } catch {
      return { success: false }
    }
  }

  async function fetchRanking() {
    try {
      const res = await apiClient.get('/mini-game/ranking')
      return { success: true, ranking: res.data.data }
    } catch {
      return { success: false, ranking: [] }
    }
  }

  return { submitScore, fetchRanking }
})
