import apiClient from '@/lib/axios'
import type { AuthResponse, ApiResponse } from '@/types'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  birth_date?: string
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login/', payload)
    return data.data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register/', payload)
    return data.data
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout/', { refresh: refreshToken })
  },

  async passwordResetRequest(email: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<ApiResponse<{ detail: string }>>('/auth/password-reset/', { email })
    return data.data
  },

  async passwordResetConfirm(payload: { uid: string; token: string; new_password: string }): Promise<{ detail: string }> {
    const { data } = await apiClient.post<ApiResponse<{ detail: string }>>('/auth/password-reset/confirm/', payload)
    return data.data
  },
}
