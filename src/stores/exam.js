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
          if (a.selectedAnswer != null) answers.value[a.questionNo] = a.selectedAnswer
          if (a.isGuessed) guesses.value[a.questionNo] = true
          if (a.isWrong) wrongs.value[a.questionNo] = true
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
    const allNos = new Set([
      ...Object.keys(answers.value).map(Number),
      ...Object.keys(guesses.value).filter(k => guesses.value[k]).map(Number),
      ...Object.keys(wrongs.value).filter(k => wrongs.value[k]).map(Number)
    ])
    const payload = [...allNos].map(no => ({
      questionNo: no,
      selectedAnswer: answers.value[no] ?? null,
      isGuessed: !!guesses.value[no],
      isWrong: !!wrongs.value[no]
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

  async function deleteSession(sessionId) {
    try {
      await apiClient.delete(`/sessions/${sessionId}`)
      return { success: true }
    } catch (_) {
      return { success: false }
    }
  }

  return {
    session, answers, guesses, wrongs, memoText, memoCanvas,
    setSession, setAnswer, clearAnswer, setGuess, clearGuess, setWrong, clearWrong, resetAll,
    loadSession, saveAnswers, saveMemo, submitExam, deleteSession
  }
})
