import { useQuery } from '@tanstack/react-query'
import { trendingService, type TrendingData } from '@/services/trendingService'

export type { TrendingData }

export function useTrending() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: trendingService.get,
    staleTime: 10 * 60 * 1000,
  })
}
