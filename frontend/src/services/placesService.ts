import apiClient from '@/lib/axios'
import type { ApiResponse, Place } from '@/types'

interface PlacesFilters {
  city?: string
  category?: string
  lat?: number
  lon?: number
  radius_km?: number
  outdoor_seating?: boolean
  fee?: boolean
  wheelchair?: string
  cuisine?: string
  open_now?: boolean
}

export const placesService = {
  async list(filters: PlacesFilters = {}): Promise<Place[]> {
    const { data } = await apiClient.get<ApiResponse<Place[]>>('/places/', { params: filters })
    return data.data
  },

  async get(id: string): Promise<Place> {
    const { data } = await apiClient.get<ApiResponse<Place>>(`/places/${id}/`)
    return data.data
  },

  async create(payload: Partial<Place>): Promise<Place> {
    const { data } = await apiClient.post<ApiResponse<Place>>('/places/', payload)
    return data.data
  },

  async update(id: string, payload: Partial<Place>): Promise<Place> {
    const { data } = await apiClient.patch<ApiResponse<Place>>(`/places/${id}/`, payload)
    return data.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/places/${id}/`)
  },
}
