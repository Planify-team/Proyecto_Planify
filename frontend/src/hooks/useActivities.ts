import { useQuery } from '@tanstack/react-query'
import { activitiesService } from '@/services/activitiesService'

export function useActivities(filters = {}) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => activitiesService.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useActivitiesPaginated(filters: Record<string, unknown> & { page: number }) {
  return useQuery({
    queryKey: ['activities-paginated', filters],
    queryFn: () => activitiesService.listPaginated(filters as any),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesService.get(id),
    enabled: !!id,
  })
}
