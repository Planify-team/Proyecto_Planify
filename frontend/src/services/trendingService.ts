import apiClient from '@/lib/axios'
import type { ApiResponse } from '@/types'

interface TrendingPlace {
  id: string
  name: string
  category: string
  city: string
  image_url: string
  price_level: number
}

interface TrendingActivity {
  id: string
  name: string
  category: string
  activity_type: string
  min_budget: string
  indoor: boolean
  outdoor: boolean
}

interface TrendingEvent {
  id: string
  title: string
  category: string
  start_date: string
  price: string
  image_url: string
}

export interface TrendingData {
  places: TrendingPlace[]
  activities: TrendingActivity[]
  events: TrendingEvent[]
}

export const trendingService = {
  async get(): Promise<TrendingData> {
    const { data } = await apiClient.get<ApiResponse<TrendingData>>('/trending/')
    return data.data
  },
}
