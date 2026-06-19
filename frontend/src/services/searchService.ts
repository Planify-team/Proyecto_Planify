import apiClient from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface SearchResults {
  places: Array<{
    id: string
    name: string
    category: string
    city: string
    image_url: string
    price_level: number
  }>
  activities: Array<{
    id: string
    name: string
    category: string
    activity_type: string
    min_budget: string
    indoor: boolean
    outdoor: boolean
    address: string
    city: string
    image_url: string
  }>
  events: Array<{
    id: string
    title: string
    category: string
    start_date: string
    price: string
    image_url: string
  }>
}

export const searchService = {
  async search(q: string): Promise<SearchResults> {
    const { data } = await apiClient.get<ApiResponse<SearchResults>>('/search/', { params: { q } })
    return data.data
  },
}
