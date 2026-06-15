import apiClient from '@/lib/axios'
import type { ApiResponse, BusinessStats, OrganizerStats, Place, Promotion, Event } from '@/types'

const BASE = '/dashboard'

export const dashboardService = {
  async getBusinessStats(): Promise<BusinessStats> {
    const { data } = await apiClient.get<ApiResponse<BusinessStats>>(`${BASE}/business/stats/`)
    return data.data
  },

  async getOwnedPlaces(): Promise<Place[]> {
    const { data } = await apiClient.get<ApiResponse<Place[]>>(`${BASE}/business/places/`)
    return data.data
  },

  async getOwnedPromotions(): Promise<Promotion[]> {
    const { data } = await apiClient.get<ApiResponse<Promotion[]>>(`${BASE}/business/promotions/`)
    return data.data
  },

  async getOrganizerStats(): Promise<OrganizerStats> {
    const { data } = await apiClient.get<ApiResponse<OrganizerStats>>(`${BASE}/organizer/stats/`)
    return data.data
  },

  async getOwnedEvents(): Promise<Event[]> {
    const { data } = await apiClient.get<ApiResponse<Event[]>>(`${BASE}/organizer/events/`)
    return data.data
  },
}
