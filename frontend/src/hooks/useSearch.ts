import { useQuery } from '@tanstack/react-query'
import { searchService } from '@/services/searchService'

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => searchService.search(q),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  })
}
