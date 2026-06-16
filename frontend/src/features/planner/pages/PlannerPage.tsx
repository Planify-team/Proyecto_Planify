import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Sparkles } from 'lucide-react'
import { PlannerForm } from '../components/PlannerForm'
import { ItineraryView } from '../components/ItineraryView'
import { InspireFeed } from '../components/InspireFeed'
import { usePlanner } from '@/hooks/usePlanner'
import { useSurprisePlan } from '@/hooks/usePlanItem'
import { useForecast } from '@/hooks/useForecast'
import WeatherForecastWidget from '@/components/ui/WeatherForecastWidget'
import type { Plan } from '@/types'

export default function PlannerPage() {
  const navigate = useNavigate()
  const planner = usePlanner()
  const surprise = useSurprisePlan()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const { data: forecast, isLoading: forecastLoading } = useForecast(coords)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords(null),
    )
  }, [])

  const handleSubmit = (input: Parameters<typeof planner.mutate>[0]) => {
    setSelectedDate(input.date)
    planner.mutate(input, {
      onSuccess: (plan) => setCurrentPlan(plan),
    })
  }

  const handleSurprise = () => {
    surprise.mutate(undefined, {
      onSuccess: (plan) => navigate(`/planes/${plan.id}`),
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planner Inteligente</h1>
          <p className="text-sm text-gray-500">Generá tu itinerario del día en segundos</p>
        </div>
      </div>

      {/* 5-day forecast */}
      {(coords || forecastLoading) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Pronóstico de la semana</h2>
          <WeatherForecastWidget
            forecast={forecast}
            isLoading={forecastLoading}
            highlightDate={selectedDate}
          />
        </div>
      )}

      {/* Surprise button */}
      <div className="flex flex-col items-center gap-2 p-5 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-100">
        <p className="text-sm text-gray-600 font-medium">¿No sabés qué hacer? Dejalo en nuestras manos</p>
        <button
          onClick={handleSurprise}
          disabled={surprise.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          {surprise.isPending ? 'Armando algo especial...' : '¡Sorprendeme!'}
        </button>
        {surprise.isError && (
          <p className="text-xs text-red-500">Error al generar el plan. Intentá de nuevo.</p>
        )}
      </div>

      {/* Plan form */}
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

      {/* Inspire Feed */}
      <div className="border-t border-gray-100 pt-6">
        <InspireFeed />
      </div>
    </div>
  )
}
