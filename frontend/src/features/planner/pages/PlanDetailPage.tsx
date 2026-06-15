import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Lock } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'
import { useRemovePlanItem, useUpdatePlan } from '@/hooks/usePlanItem'
import { ItineraryView } from '../components/ItineraryView'
import { SharePlanButton } from '../components/SharePlanButton'
import { PlanFeedbackModal } from '../components/PlanFeedbackModal'
import Button from '@/components/ui/Button'
import type { PlanItem } from '@/types'

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: plan, isLoading } = usePlan(id ?? '')
  const removeItem = useRemovePlanItem(id ?? '')
  const updatePlan = useUpdatePlan(id ?? '')

  const [feedbackItem, setFeedbackItem] = useState<PlanItem | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Cargando plan...
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
        <p>Plan no encontrado.</p>
        <button onClick={() => navigate('/mis-planes')} className="mt-2 text-primary-600 hover:underline">
          Volver a mis planes
        </button>
      </div>
    )
  }

  const handleMakePublic = () => {
    updatePlan.mutate({ is_public: true })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/mis-planes')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis planes
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {plan.city} · {plan.people_count} persona{plan.people_count !== 1 ? 's' : ''} · ${plan.budget}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={plan.is_public ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
            onClick={() => updatePlan.mutate({ is_public: !plan.is_public })}
            isLoading={updatePlan.isPending}
          >
            {plan.is_public ? 'Público' : 'Privado'}
          </Button>

          <SharePlanButton
            planId={plan.id}
            slug={plan.slug}
            isPublic={plan.is_public}
            onMakePublic={handleMakePublic}
          />
        </div>
      </div>

      {plan.items.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          Este plan no tiene ítems aún.
        </div>
      ) : (
        <ItineraryView
          plan={plan}
          onRemoveItem={(itemId) => removeItem.mutate(itemId)}
          onFeedbackItem={setFeedbackItem}
        />
      )}

      <PlanFeedbackModal
        isOpen={feedbackItem !== null}
        onClose={() => setFeedbackItem(null)}
        planId={plan.id}
        item={feedbackItem}
      />
    </div>
  )
}
