import apiClient from '@/lib/axios'
import type { ApiResponse, PaginatedResponse, Event } from '@/types'

interface EventsFilters {
  category?: string
  city?: string
  date_from?: string
  date_to?: string
  free?: boolean
  name?: string
  place?: string
}

export const eventsService = {
  async list(filters: EventsFilters = {}): Promise<Event[]> {
    const { data } = await apiClient.get<ApiResponse<Event[]>>('/events/', { params: filters })
    return data.data
  },

  async listPaginated(filters: EventsFilters & { page: number }): Promise<PaginatedResponse<Event>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/events/', { params: filters })
    return data.data
  },

  async get(id: string): Promise<Event> {
    const { data } = await apiClient.get<ApiResponse<Event>>(`/events/${id}/`)
    return data.data
  },
}
