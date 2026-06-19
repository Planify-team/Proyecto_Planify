import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Lock, Copy, CalendarDays, Link } from 'lucide-react'
import { toast } from 'sonner'
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
import EmptyState from '@/components/common/EmptyState'
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-4 w-16 bg-gray-200/20 rounded" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200/20 rounded" />
            <div className="h-4 w-32 bg-gray-200/20 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200/20 rounded-lg" />
            <div className="h-8 w-20 bg-gray-200/20 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Plan no encontrado"
          description="Este plan no existe o no tenés acceso a él."
          icon={<CalendarDays className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Volver a mis planes', onClick: () => navigate('/mis-planes') }}
        />
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <title>{plan.title} | Planify</title>
      <button
        onClick={() => navigate('/mis-planes')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis planes
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {plan.city} · {plan.people_count} persona{plan.people_count !== 1 ? 's' : ''} · ${Number(plan.budget).toLocaleString('es-AR')}
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

          {plan.is_public && plan.slug && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Link className="h-4 w-4" />}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/planes/p/${plan.slug}`)
                toast.success('Enlace copiado al portapapeles')
              }}
            >
              Copiar enlace
            </Button>
          )}

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
        <div className="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200/30">
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
        <EmptyState
          title="Plan vacío"
          description="Este plan no tiene actividades todavía. Podés agregar ítems desde el Planner."
          icon={<CalendarDays className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Ir al Planner', onClick: () => navigate('/planner') }}
        />
      ) : (
        <ItineraryView
          plan={plan}
          onRemoveItem={(itemId) => removeItem.mutate(itemId, {
            onSuccess: () => toast.success('Ítem eliminado del plan'),
            onError: () => toast.error('No se pudo eliminar el ítem'),
          })}
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
