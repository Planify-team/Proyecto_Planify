import { MapPin, CalendarDays, Eye, Copy } from 'lucide-react'
import type { TrendingPlan } from '@/types'

interface Props {
  plan: TrendingPlan
  onUseAsBase: (plan: TrendingPlan) => void
}

export function TrendingPlanCard({ plan, onUseAsBase }: Props) {
  const d = new Date(plan.date + 'T12:00:00')
  const day = d.getDate()
  const month = d.toLocaleDateString('es-AR', { month: 'short' })

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Mini calendar badge */}
        <div className="flex-shrink-0 w-10 text-center bg-primary-500/10 rounded-lg py-1">
          <p className="text-sm font-bold text-primary-600 leading-none">{day}</p>
          <p className="text-[9px] font-medium text-primary-500 uppercase">{month}</p>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{plan.title}</h3>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {plan.city}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {plan.item_count} ítem{plan.item_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {plan.view_count > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
            <Eye className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Vistas: </span>
            {plan.view_count}
          </span>
        )}
      </div>

      <button
        onClick={() => onUseAsBase(plan)}
        aria-label={`Usar como base: ${plan.title}`}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-400/30 hover:bg-primary-500/10 rounded-xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      >
        <Copy className="h-3 w-3" aria-hidden="true" />
        Usar como base
      </button>
    </div>
  )
}
