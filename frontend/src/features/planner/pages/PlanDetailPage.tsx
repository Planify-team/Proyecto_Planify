import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Lock, Copy } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'
import { useRemovePlanItem, useUpdatePlan, useUpdatePlanItem, useClonePlan } from '@/hooks/usePlanItem'
import { useForecast } from '@/hooks/useForecast'
import { ItineraryView } from '../components/ItineraryView'
import { SharePlanButton } from '../components/SharePlanButton'
import { PlanFeedbackModal } from '../components/PlanFeedbackModal'
import { CalendarExportButton } from '../components/CalendarExportButton'
import { ClonePlanModal } from '../components/ClonePlanModal'
import WeatherForecastWidget from '@/components/ui/WeatherForecastWidget'
import Button from '@/components/ui/Button'
import type { PlanItem } from '@/types'

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: plan, isLoading } = usePlan(id ?? '')
  const removeItem = useRemovePlanItem(id ?? '')
  const updatePlan = useUpdatePlan(id ?? '')
  const updateItem = useUpdatePlanItem(id ?? '')
  const clonePlan = useClonePlan()

  const [feedbackItem, setFeedbackItem] = useState<PlanItem | null>(null)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const { data: forecast, isLoading: forecastLoading } = useForecast(coords)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords(null),
    )
  }, [])

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

  const handleSaveNote = (itemId: string, note: string) => {
    updateItem.mutate({ itemId, payload: { note } })
  }

  const handleReorder = (itemId: string, direction: 'up' | 'down') => {
    const item = plan.items.find((i) => i.id === itemId)
    if (!item) return
    const slotItems = plan.items
      .filter((i) => i.slot === item.slot)
      .sort((a, b) => a.order - b.order)
    const idx = slotItems.findIndex((i) => i.id === itemId)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= slotItems.length) return
    const targetItem = slotItems[targetIdx]
    updateItem.mutate({ itemId, payload: { order: targetItem.order } })
    updateItem.mutate({ itemId: targetItem.id, payload: { order: item.order } })
  }

  const handleClone = (date: string) => {
    clonePlan.mutate(
      { planId: plan.id, date },
      {
        onSuccess: (cloned) => {
          setShowCloneModal(false)
          navigate(`/planes/${cloned.id}`)
        },
      }
    )
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

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={plan.is_public ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
            onClick={() => updatePlan.mutate({ is_public: !plan.is_public })}
            isLoading={updatePlan.isPending}
          >
            {plan.is_public ? 'Público' : 'Privado'}
          </Button>

          <CalendarExportButton plan={plan} />

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Copy className="h-4 w-4" />}
            onClick={() => setShowCloneModal(true)}
          >
            Usar de nuevo
          </Button>

          <SharePlanButton
            planId={plan.id}
            slug={plan.slug}
            isPublic={plan.is_public}
            onMakePublic={handleMakePublic}
          />
        </div>
      </div>

      {/* Forecast for plan date (only for future plans) */}
      {plan.date >= new Date().toISOString().slice(0, 10) && coords && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">
            Pronóstico para el {new Date(plan.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <WeatherForecastWidget
            forecast={forecast}
            isLoading={forecastLoading}
            highlightDate={plan.date}
          />
        </div>
      )}

      {plan.items.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          Este plan no tiene ítems aún.
        </div>
      ) : (
        <ItineraryView
          plan={plan}
          onRemoveItem={(itemId) => removeItem.mutate(itemId)}
          onFeedbackItem={setFeedbackItem}
          onSaveNote={handleSaveNote}
          onReorderItem={handleReorder}
        />
      )}

      <PlanFeedbackModal
        isOpen={feedbackItem !== null}
        onClose={() => setFeedbackItem(null)}
        planId={plan.id}
        item={feedbackItem}
      />

      <ClonePlanModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onConfirm={handleClone}
        isLoading={clonePlan.isPending}
        title="Usar de nuevo"
      />
    </div>
  )
}
