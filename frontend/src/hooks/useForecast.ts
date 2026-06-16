import { useQuery } from '@tanstack/react-query'
import { weatherService } from '@/services/weatherService'

export function useForecast(coords: { lat: number; lon: number } | null) {
  return useQuery({
    queryKey: ['forecast', coords?.lat, coords?.lon],
    queryFn: () => weatherService.getForecast(coords!.lat, coords!.lon),
    enabled: coords !== null,
    staleTime: 1000 * 60 * 60 * 3, // 3h — matches Redis TTL
    retry: false,
  })
}
