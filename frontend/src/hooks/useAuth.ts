import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/axios'
import type { User } from '@/types'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh)
      const next = searchParams.get('next')
      navigate(next && next.startsWith('/') ? next : '/')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh)
      const next = searchParams.get('next')
      navigate(next && next.startsWith('/') ? next : '/')
    },
  })
}

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: (email: string) => authService.passwordResetRequest(email),
  })
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: authService.passwordResetConfirm,
  })
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(refreshToken ?? ''),
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })
}

export function useUpdateProfile() {
  const { user, setUser } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: { first_name?: string; last_name?: string }) => {
      const { data } = await apiClient.patch<{ data: User }>(`/users/${user!.id}/`, payload)
      return data.data
    },
    onSuccess: (updated) => setUser(updated),
  })
}

