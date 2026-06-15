import { useMutation, useQueryClient } from '@tanstack/react-query'
import { plannerService } from '@/services/plannerService'
import type { PlanGenerateInput } from '@/types'

export function usePlanner() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: PlanGenerateInput) => plannerService.generate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-plans'] })
    },
  })
}
