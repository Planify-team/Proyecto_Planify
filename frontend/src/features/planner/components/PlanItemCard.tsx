import { X, Star } from 'lucide-react'
import type { PlanItem } from '@/types'
import { SlotBadge } from './SlotBadge'

interface Props {
  item: PlanItem
  onRemove?: (itemId: string) => void
  onFeedback?: (item: PlanItem) => void
  readonly?: boolean
}

const ENTITY_LABELS: Record<string, string> = {
  place: 'Lugar',
  activity: 'Actividad',
  event: 'Evento',
}

export function PlanItemCard({ item, onRemove, onFeedback, readonly = false }: Props) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SlotBadge slot={item.slot} />
          <span className="text-xs text-gray-400 capitalize">
            {ENTITY_LABELS[item.entity_type] || item.entity_type}
          </span>
        </div>

        {item.generation_reason && (
          <p className="text-xs text-gray-500 italic mt-1">{item.generation_reason}</p>
        )}
        {item.note && (
          <p className="text-sm text-gray-700 mt-1">{item.note}</p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onFeedback && (
          <button
            onClick={() => onFeedback(item)}
            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
            aria-label="Calificar ítem"
            title="Dar feedback"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        {!readonly && onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Quitar ítem"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
