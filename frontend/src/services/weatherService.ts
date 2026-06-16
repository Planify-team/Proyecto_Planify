import apiClient from '@/lib/axios'
import type { ApiResponse, Weather, ForecastDay } from '@/types'

export const weatherService = {
  async getCurrent(lat: number, lon: number): Promise<Weather | null> {
    const { data } = await apiClient.get<ApiResponse<Weather | null>>('/weather/current/', {
      params: { lat, lon },
    })
    return data.data
  },

  async getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
    const { data } = await apiClient.get<ApiResponse<ForecastDay[]>>('/weather/forecast/', {
      params: { lat, lon },
    })
    return data.data
  },
}
