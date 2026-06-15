import { useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { usePublicPlan } from '@/hooks/usePlan'
import { ItineraryView } from '../components/ItineraryView'

export default function PlanPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: plan, isLoading, isError } = usePublicPlan(slug ?? '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
        Cargando plan...
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 text-sm text-center px-4">
        <MapPin className="h-12 w-12 mb-3 text-gray-300" />
        <p className="font-medium">Plan no encontrado</p>
        <p className="text-xs text-gray-400 mt-1">Este plan no existe o no está disponible de forma pública.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span className="font-bold text-primary-600 text-lg">Planify</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {plan.city} · {plan.people_count} persona{plan.people_count !== 1 ? 's' : ''} · {plan.date}
        </p>

        {plan.items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Este plan no tiene ítems.</p>
        ) : (
          <ItineraryView plan={plan} readonly />
        )}
      </main>
    </div>
  )
}
