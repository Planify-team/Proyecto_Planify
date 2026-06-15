import { useQuery } from '@tanstack/react-query'
import { plannerService } from '@/services/plannerService'

export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => plannerService.getById(id),
    enabled: !!id,
  })
}

export function usePublicPlan(slug: string) {
  return useQuery({
    queryKey: ['plan-public', slug],
    queryFn: () => plannerService.getBySlug(slug),
    enabled: !!slug,
  })
}
