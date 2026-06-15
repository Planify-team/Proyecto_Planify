import { useNavigate } from 'react-router-dom'
import { CalendarDays, Trash2, Globe, Lock } from 'lucide-react'
import { useMyPlans } from '@/hooks/useMyPlans'
import { useDeletePlan } from '@/hooks/usePlanItem'
import Button from '@/components/ui/Button'

export default function MyPlansPage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = useMyPlans()
  const deletePlan = useDeletePlan()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Cargando planes...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mis Planes</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/planner')}>
          + Nuevo plan
        </Button>
      </div>

      {(!plans || plans.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm text-center">
          <CalendarDays className="h-12 w-12 mb-2 text-gray-300" />
          <p>Todavía no tenés planes guardados.</p>
          <button
            onClick={() => navigate('/planner')}
            className="mt-2 text-primary-600 hover:underline text-sm"
          >
            Crear tu primer plan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => navigate(`/planes/${plan.id}`)}
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
                  {plan.city} · {plan.items.length} ítems · {plan.date}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deletePlan.mutate(plan.id)
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Eliminar plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
