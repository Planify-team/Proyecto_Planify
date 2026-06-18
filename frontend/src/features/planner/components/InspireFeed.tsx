import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { TrendingPlanCard } from './TrendingPlanCard'
import { ClonePlanModal } from './ClonePlanModal'
import { useTrendingPlans } from '@/hooks/useTrendingPlans'
import { useClonePlan } from '@/hooks/usePlanItem'
import type { TrendingPlan } from '@/types'

export function InspireFeed() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading } = useTrendingPlans({ limit: 6 })
  const clonePlan = useClonePlan()
  const [selectedPlan, setSelectedPlan] = useState<TrendingPlan | null>(null)

  const handleClone = (date: string) => {
    if (!selectedPlan) return
    clonePlan.mutate(
      { planId: selectedPlan.id, date },
      {
        onSuccess: (cloned) => {
          setSelectedPlan(null)
          navigate(`/planes/${cloned.id}`)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        Cargando planes populares...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary-500" />
        <h2 className="text-sm font-semibold text-gray-600">Inspirate — Planes populares</h2>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Todavía no hay planes populares. ¡Sé el primero en compartir el tuyo!
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {plans.map((plan) => (
            <TrendingPlanCard
              key={plan.id}
              plan={plan}
              onUseAsBase={setSelectedPlan}
            />
          ))}
        </div>
      )}

      <ClonePlanModal
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        onConfirm={handleClone}
        isLoading={clonePlan.isPending}
      />
    </div>
  )
}
