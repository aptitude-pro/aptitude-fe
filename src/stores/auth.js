import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api'

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch (_) {
    return true
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 스토어 초기화 시점에 동기적으로 만료 토큰 정리 (컴포넌트 마운트 전)
  const _storedToken = localStorage.getItem('accessToken')
  if (_storedToken && isTokenExpired(_storedToken)) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const showModal = ref(false)
  const modalTab = ref('login') // 'login' | 'register'
  const pendingRedirectPath = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  function openModal(tab = 'login') {
    modalTab.value = tab
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function setAuth(userData, token) {
    user.value = userData
    accessToken.value = token
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', token)
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
  }

  async function login(email, password) {
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      const { user: userData, accessToken: token } = res.data.data
      setAuth(userData, token)
      closeModal()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
  }

  async function sendEmailCode(email) {
    try {
      await apiClient.post('/auth/email/send-code', { email })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '인증코드 발송에 실패했습니다.' }
    }
  }

  async function verifyEmailCode(email, code) {
    try {
      await apiClient.post('/auth/email/verify', { email, code })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '인증코드가 올바르지 않습니다.' }
    }
  }

  async function register(payload) {
    try {
      const res = await apiClient.post('/auth/register', payload)
      const { user: userData, accessToken: token } = res.data.data
      setAuth(userData, token)
      closeModal()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '회원가입에 실패했습니다.' }
    }
  }

  function setPendingRedirect(path) {
    pendingRedirectPath.value = path
  }
  function consumePendingRedirect() {
    const p = pendingRedirectPath.value
    pendingRedirectPath.value = null
    return p
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch (_) {}
    clearAuth()
  }

  return {
    user, accessToken, isLoggedIn, showModal, modalTab,
    openModal, closeModal, login, register, logout, setAuth, clearAuth,
    sendEmailCode, verifyEmailCode,
    setPendingRedirect, consumePendingRedirect
  }
})
