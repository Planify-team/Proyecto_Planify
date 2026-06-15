import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { PlannerForm } from '../components/PlannerForm'
import { ItineraryView } from '../components/ItineraryView'
import { usePlanner } from '@/hooks/usePlanner'
import type { Plan } from '@/types'
import { useState } from 'react'

export default function PlannerPage() {
  const navigate = useNavigate()
  const planner = usePlanner()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)

  const handleSubmit = (input: Parameters<typeof planner.mutate>[0]) => {
    planner.mutate(input, {
      onSuccess: (plan) => setCurrentPlan(plan),
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planner Inteligente</h1>
          <p className="text-sm text-gray-500">Generá tu itinerario del día en segundos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Configurar plan</h2>
          <PlannerForm onSubmit={handleSubmit} isLoading={planner.isPending} />
        </div>

        <div>
          {planner.isPending && (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              Generando tu itinerario...
            </div>
          )}

          {planner.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Error al generar el plan. Intentá de nuevo.
            </div>
          )}

          {currentPlan && !planner.isPending && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">{currentPlan.title}</h2>
                <button
                  onClick={() => navigate(`/planes/${currentPlan.id}`)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Ver detalle →
                </button>
              </div>

              {currentPlan.items.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No se encontraron opciones para esa ciudad y fecha. Probá con otra ciudad.
                </p>
              ) : (
                <ItineraryView plan={currentPlan} readonly />
              )}
            </div>
          )}

          {!currentPlan && !planner.isPending && !planner.isError && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm text-center">
              <CalendarDays className="h-10 w-10 mb-2 text-gray-300" />
              Completá el formulario para generar tu plan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
