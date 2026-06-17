import apiClient from '@/lib/axios'
import type { ApiResponse, Activity } from '@/types'

interface ActivitiesFilters {
  type?: string
  category?: string
  indoor?: boolean
  outdoor?: boolean
  budget?: number
  free?: boolean
  name?: string
}

export const activitiesService = {
  async list(filters: ActivitiesFilters = {}): Promise<Activity[]> {
    const { data } = await apiClient.get<ApiResponse<Activity[]>>('/activities/', { params: filters })
    return data.data
  },

  async get(id: string): Promise<Activity> {
    const { data } = await apiClient.get<ApiResponse<Activity>>(`/activities/${id}/`)
    return data.data
  },
}
