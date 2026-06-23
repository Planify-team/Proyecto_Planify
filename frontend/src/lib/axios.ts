import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue of pending requests that arrived while a token refresh was in progress
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void }
let isRefreshing = false
let failedQueue: QueueEntry[] = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((entry) => {
    if (error) entry.reject(error)
    else entry.resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until the in-progress refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) {
      isRefreshing = false
      processQueue(error)
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL ?? '/api/v1'}/auth/refresh/`, { refresh: refreshToken })
      // simplejwt returns a NEW refresh token when ROTATE_REFRESH_TOKENS = True
      const { access, refresh: newRefresh } = response.data
      useAuthStore.getState().setTokens(access, newRefresh ?? refreshToken)
      originalRequest.headers.Authorization = `Bearer ${access}`
      processQueue(null, access)
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
