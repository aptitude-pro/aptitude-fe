import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const showModal = ref(false)
  const modalTab = ref('login') // 'login' | 'register'

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

  async function logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch (_) {}
    clearAuth()
  }

  return {
    user, accessToken, isLoggedIn, showModal, modalTab,
    openModal, closeModal, login, register, logout, setAuth, clearAuth
  }
})
