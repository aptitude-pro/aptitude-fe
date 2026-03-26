import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api',
  timeout: 10000
})

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 동시에 여러 401이 발생할 때 refresh 요청을 하나로 합침
let _refreshPromise = null

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      // 토큰이 없는 비회원은 refresh 시도 없이 그냥 reject
      if (!localStorage.getItem('accessToken')) {
        return Promise.reject(err)
      }
      try {
        if (!_refreshPromise) {
          _refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
            .finally(() => { _refreshPromise = null })
        }
        const res = await _refreshPromise
        const newToken = res.data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (_) {
        _refreshPromise = null
        const authStore = useAuthStore()
        authStore.clearAuth()
        authStore.openModal('login')
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

export default apiClient
