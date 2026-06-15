import { useQuery } from '@tanstack/react-query'
import { plannerService } from '@/services/plannerService'

export function useMyPlans() {
  return useQuery({
    queryKey: ['my-plans'],
    queryFn: () => plannerService.list(),
  })
}
