import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api'

export const useExamStore = defineStore('exam', () => {
  const session = ref(null)
  const answers = ref({})
  const guesses = ref({})
  const wrongs = ref({})
  const memoText = ref('')
  const memoCanvas = ref(null)

  function setSession(s) {
    session.value = s
  }

  function setAnswer(questionNo, answer) {
    answers.value[questionNo] = answer
  }

  function clearAnswer(questionNo) {
    delete answers.value[questionNo]
  }

  function setGuess(questionNo) { guesses.value[questionNo] = true }
  function clearGuess(questionNo) { delete guesses.value[questionNo] }

  function setWrong(questionNo) { wrongs.value[questionNo] = true }
  function clearWrong(questionNo) { delete wrongs.value[questionNo] }

  function resetAll() {
    session.value = null
    answers.value = {}
    guesses.value = {}
    wrongs.value = {}
    memoText.value = ''
    memoCanvas.value = null
  }

  async function loadSession(sessionId) {
    try {
      const res = await apiClient.get(`/sessions/${sessionId}`)
      session.value = res.data.data
      // 저장된 답안 복구
      if (session.value.answers) {
        session.value.answers.forEach(a => {
          answers.value[a.questionNo] = a.selectedAnswer
        })
      }
      if (session.value.memoData?.text) {
        memoText.value = session.value.memoData.text
      }
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  async function saveAnswers(sessionId) {
    const payload = Object.entries(answers.value).map(([questionNo, selectedAnswer]) => ({
      questionNo: parseInt(questionNo),
      selectedAnswer
    }))
    try {
      await apiClient.put(`/sessions/${sessionId}/answers`, { answers: payload })
    } catch (_) {}
  }

  async function saveMemo(sessionId, text, canvasData) {
    try {
      await apiClient.put(`/sessions/${sessionId}/memo`, { text, canvasData })
    } catch (_) {}
  }

  async function submitExam(sessionId) {
    try {
      const res = await apiClient.post(`/sessions/${sessionId}/submit`)
      return { success: true, data: res.data.data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '제출에 실패했습니다.' }
    }
  }

  return {
    session, answers, guesses, wrongs, memoText, memoCanvas,
    setSession, setAnswer, clearAnswer, setGuess, clearGuess, setWrong, clearWrong, resetAll,
    loadSession, saveAnswers, saveMemo, submitExam
  }
})
