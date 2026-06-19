import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Sparkles, CalendarDays } from 'lucide-react'
import { usePublicPlan } from '@/hooks/usePlan'
import { ItineraryView } from '../components/ItineraryView'
import EmptyState from '@/components/common/EmptyState'

export default function PlanPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: plan, isLoading, isError } = usePublicPlan(slug ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen animate-pulse">
        <header className="glass-nav border-b border-gray-200/20 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200/20 rounded-full" />
            <div className="h-5 w-20 bg-gray-200/20 rounded" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
          <div className="h-6 w-64 bg-gray-200/20 rounded" />
          <div className="h-4 w-40 bg-gray-200/20 rounded" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <div className="p-5 bg-primary-500/10 rounded-2xl border border-primary-400/20">
          <MapPin className="h-12 w-12 text-primary-400" />
        </div>
        <p className="text-lg font-semibold text-gray-800">Plan no encontrado</p>
        <p className="text-sm text-gray-500 max-w-xs">Este plan no existe o no está disponible de forma pública.</p>
        <button
          onClick={() => navigate('/register')}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <Sparkles className="h-4 w-4" />
          Crear mi propio plan
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <title>{plan.title} | Planify</title>
      <header className="glass-nav border-b border-gray-200/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span className="font-bold text-primary-600 text-lg">Planify</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {plan.city} · {plan.people_count} persona{plan.people_count !== 1 ? 's' : ''} ·{' '}
          {new Date(plan.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {plan.items.length === 0 ? (
          <EmptyState
            title="Plan vacío"
            description="Este plan compartido no tiene actividades todavía."
            icon={<CalendarDays className="h-10 w-10 text-gray-300" />}
          />
        ) : (
          <ItineraryView plan={plan} readonly />
        )}

        <div className="mt-10 p-5 bg-gradient-to-r from-violet-900/50 to-primary-900/40 rounded-2xl border border-primary-400/20 text-center">
          <Sparkles className="h-6 w-6 text-primary-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800 mb-1">¿Te gustó este plan?</p>
          <p className="text-xs text-gray-500 mb-3">Creá el tuyo gratis en Planify — planes personalizados en segundos.</p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <Sparkles className="h-4 w-4" />
            Crear mi plan gratis
          </button>
        </div>
      </main>
    </div>
  )
}
