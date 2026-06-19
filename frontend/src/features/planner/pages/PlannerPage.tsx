import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Sparkles, ArrowRight } from 'lucide-react'
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
      <title>Planner | Planify</title>
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planner Inteligente</h1>
          <p className="text-sm text-gray-500">Generá tu itinerario del día en segundos</p>
        </div>
      </div>

      {/* Plan form + result */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-glass-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Configurar plan</h2>
          <PlannerForm onSubmit={handleSubmit} isLoading={planner.isPending} />
        </div>

        <div>
          {planner.isPending && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce shadow-neon-sm"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">Generando tu itinerario...</p>
            </div>
          )}

          {planner.isError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              Error al generar el plan. Intentá de nuevo.
            </div>
          )}

          {currentPlan && !planner.isPending && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-glass-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">{currentPlan.title}</h2>
                <span className="text-xs text-gray-500">
                  {currentPlan.items.length} {currentPlan.items.length === 1 ? 'actividad' : 'actividades'}
                </span>
              </div>

              {currentPlan.items.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No encontramos actividades para esa ciudad y fecha. Probá con otra ciudad.
                </p>
              ) : (
                <ItineraryView plan={currentPlan} readonly />
              )}

              <button
                onClick={() => navigate(`/planes/${currentPlan.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                Ver plan completo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {!currentPlan && !planner.isPending && !planner.isError && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm text-center">
              <CalendarDays className="h-10 w-10 mb-2 text-primary-400/50" />
              Completá el formulario para generar tu plan
            </div>
          )}
        </div>
      </div>

      {/* Surprise button */}
      <div className="flex flex-col items-center gap-2 p-5 bg-gradient-to-r from-primary-100/40 to-violet-900/30 rounded-xl border border-primary-400/20 shadow-neon-sm">
        <p className="text-sm text-gray-600 font-medium">¿No sabés qué hacer? Dejalo en nuestras manos</p>
        <button
          onClick={handleSurprise}
          disabled={surprise.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-neon transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <Sparkles className="h-5 w-5" />
          {surprise.isPending ? 'Armando algo especial...' : '¡Sorprendeme!'}
        </button>
        {surprise.isError && (
          <p className="text-xs text-red-500">Error al generar el plan. Intentá de nuevo.</p>
        )}
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

      {/* Inspire Feed — only when no plan has been generated yet */}
      {!currentPlan && (
        <div className="border-t border-gray-200/30 pt-6">
          <InspireFeed />
        </div>
      )}
    </div>
  )
}
