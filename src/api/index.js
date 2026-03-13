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

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = res.data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (_) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        const authStore = useAuthStore()
        authStore.openModal('login')
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

export default apiClient
