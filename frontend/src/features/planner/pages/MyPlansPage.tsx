import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Trash2, Globe, Lock, Plus, Clock, CheckCircle2, FileEdit, Sparkles, CalendarCheck, XCircle } from 'lucide-react'
import { useMyPlans, useDeletePlan } from '@/hooks/usePlanner'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/common/EmptyState'
import type { Plan } from '@/types'

function isPast(dateIso: string) {
  const planDate = new Date(dateIso + 'T23:59:59')
  return planDate < new Date()
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  draft: {
    label: 'Borrador',
    icon: <FileEdit className="h-3 w-3" aria-hidden="true" />,
    cls: 'bg-gray-300/10 text-gray-500 border-gray-300/20',
  },
  generated: {
    label: 'Generado',
    icon: <Sparkles className="h-3 w-3" aria-hidden="true" />,
    cls: 'bg-primary-500/10 text-primary-600 border-primary-400/20',
  },
  planned: {
    label: 'Planificado',
    icon: <CalendarCheck className="h-3 w-3" aria-hidden="true" />,
    cls: 'bg-blue-500/10 text-blue-600 border-blue-400/20',
  },
  completed: {
    label: 'Completado',
    icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
    cls: 'bg-green-500/10 text-green-600 border-green-400/20',
  },
  cancelled: {
    label: 'Cancelado',
    icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
    cls: 'bg-red-500/10 text-red-500 border-red-400/20',
  },
}

function PlanRow({
  plan,
  onDelete,
  confirmingId,
  setConfirmingId,
}: {
  plan: Plan
  onDelete: (e: React.MouseEvent, id: string) => void
  confirmingId: string | null
  setConfirmingId: (id: string | null) => void
}) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft
  const past = isPast(plan.date)
  const planDate = new Date(plan.date + 'T12:00:00')

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/30 hover:shadow-neon-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${past ? 'opacity-70 hover:opacity-100' : ''}`}
      onClick={() => navigate(`/planes/${plan.id}`)}
      role="button"
      tabIndex={0}
      aria-label={plan.title}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/planes/${plan.id}`)}
    >
      {/* Date column */}
      <div className={`flex-shrink-0 w-12 text-center rounded-lg py-1.5 ${past ? 'bg-gray-100/40' : 'bg-primary-500/10'}`}>
        <p className={`text-lg font-bold leading-none ${past ? 'text-gray-400' : 'text-primary-600'}`}>
          {planDate.getDate()}
        </p>
        <p className={`text-[10px] font-medium uppercase ${past ? 'text-gray-400' : 'text-primary-500'}`}>
          {planDate.toLocaleDateString('es-AR', { month: 'short' })}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{plan.title}</h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${status.cls}`}>
            {status.icon}{status.label}
          </span>
          {plan.is_public ? (
            <>
              <Globe className="h-3 w-3 text-green-500 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Público</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Privado</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {plan.city} · {planDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {plan.items.length > 0 && (
            <span className="ml-1">· {plan.items.length} {plan.items.length === 1 ? 'actividad' : 'actividades'}</span>
          )}
        </p>
      </div>

      <button
        onClick={(e) => onDelete(e, plan.id)}
        onBlur={() => setConfirmingId(null)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${
          confirmingId === plan.id
            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
            : 'text-gray-300 hover:text-red-500 hover:bg-red-500/10'
        }`}
        aria-label={confirmingId === plan.id ? `Confirmar eliminación de ${plan.title}` : `Eliminar plan: ${plan.title}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {confirmingId === plan.id && <span>Confirmar</span>}
      </button>
    </div>
  )
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

  const allPlans = plans ?? []
  const { upcoming, past } = useMemo(() => {
    const now = new Date()
    const up: typeof allPlans = [], past: typeof allPlans = []
    for (const p of allPlans) {
      (new Date(p.date + 'T23:59:59') < now ? past : up).push(p)
    }
    up.sort((a, b) => (a.date < b.date ? -1 : 1))
    past.sort((a, b) => (a.date < b.date ? 1 : -1))
    return { upcoming: up, past }
  }, [allPlans])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <title>Mis planes | Planify</title>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Mis Planes</h1>
          {allPlans.length > 0 && (
            <span className="text-sm text-gray-400 font-medium">{allPlans.length} en total</span>
          )}
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => navigate('/planner')}>
          Nuevo plan
        </Button>
      </div>

      {allPlans.length === 0 ? (
        <EmptyState
          title="Todavía no tenés planes"
          description="Usá el Planner para generar tu primer itinerario del día."
          icon={<CalendarDays className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Crear mi primer plan', onClick: () => navigate('/planner') }}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Próximos
              </h2>
              <div className="space-y-3">
                {upcoming.map((plan) => (
                  <PlanRow
                    key={plan.id}
                    plan={plan}
                    onDelete={handleDelete}
                    confirmingId={confirmingId}
                    setConfirmingId={setConfirmingId}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Pasados
              </h2>
              <div className="space-y-3">
                {past.map((plan) => (
                  <PlanRow
                    key={plan.id}
                    plan={plan}
                    onDelete={handleDelete}
                    confirmingId={confirmingId}
                    setConfirmingId={setConfirmingId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
