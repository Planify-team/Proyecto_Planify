import type { ApiError } from '@/types'

interface AxiosErrorLike {
  response?: { data?: unknown }
}

function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    (data as ApiError).success === false &&
    'error' in data
  )
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as AxiosErrorLike)?.response?.data
  if (isApiError(data)) return data.error.message
  return fallback
}
