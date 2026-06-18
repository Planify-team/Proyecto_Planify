import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Trash2, Globe, Lock, Plus } from 'lucide-react'
import { useMyPlans } from '@/hooks/useMyPlans'
import { useDeletePlan } from '@/hooks/usePlanItem'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/common/EmptyState'

function formatPlanDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function MyPlansPage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = useMyPlans()
  const deletePlan = useDeletePlan()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="plans-skeleton">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-7 w-7 rounded-full bg-gray-200/20 animate-pulse" />
          <div className="h-7 w-32 bg-gray-200/20 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 shadow-glass-sm animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const handleDelete = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation()
    if (confirmingId === planId) {
      deletePlan.mutate(planId)
      setConfirmingId(null)
    } else {
      setConfirmingId(planId)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <title>Mis planes | Planify</title>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mis Planes</h1>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/planner')}>
          Nuevo plan
        </Button>
      </div>

      {(!plans || plans.length === 0) ? (
        <EmptyState
          title="Todavía no tenés planes"
          description="Usá el Planner para generar tu primer itinerario del día."
          icon={<CalendarDays className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Crear mi primer plan', onClick: () => navigate('/planner') }}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/30 hover:shadow-neon-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              onClick={() => navigate(`/planes/${plan.id}`)}
              role="button"
              tabIndex={0}
              aria-label={plan.title}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/planes/${plan.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{plan.title}</h3>
                  {plan.is_public ? (
                    <Globe className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-label="Público" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-label="Privado" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.city} · {formatPlanDate(plan.date)}
                  {plan.items.length > 0 && ` · ${plan.items.length} ${plan.items.length === 1 ? 'actividad' : 'actividades'}`}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, plan.id)}
                onBlur={() => setConfirmingId(null)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                  confirmingId === plan.id
                    ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                    : 'text-gray-300 hover:text-red-500 hover:bg-red-500/10'
                }`}
                aria-label="Eliminar plan"
              >
                <Trash2 className="h-4 w-4" />
                {confirmingId === plan.id && <span>Confirmar</span>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
