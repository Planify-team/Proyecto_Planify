import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/eventsService'

export function useEvents(filters = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsService.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useEventsPaginated(filters: Record<string, unknown> & { page: number }) {
  return useQuery({
    queryKey: ['events-paginated', filters],
    queryFn: () => eventsService.listPaginated(filters as any),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsService.get(id),
    enabled: !!id,
  })
}
