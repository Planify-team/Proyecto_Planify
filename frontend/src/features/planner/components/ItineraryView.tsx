import type { Plan, PlanItem, PlanSlot } from '@/types'
import { PlanItemCard } from './PlanItemCard'

const SLOTS: PlanSlot[] = ['morning', 'afternoon', 'evening']

const SLOT_LABELS: Record<PlanSlot, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
}

const SLOT_COLORS: Record<PlanSlot, string> = {
  morning:   'bg-amber-500/15 text-amber-400',
  afternoon: 'bg-blue-500/15 text-blue-400',
  evening:   'bg-primary-500/15 text-primary-600',
}

interface Props {
  plan: Plan
  onRemoveItem?: (itemId: string) => void
  onFeedbackItem?: (item: PlanItem) => void
  onSaveNote?: (itemId: string, note: string) => void
  onReorderItem?: (itemId: string, direction: 'up' | 'down') => void
  readonly?: boolean
}

export function ItineraryView({ plan, onRemoveItem, onFeedbackItem, onSaveNote, onReorderItem, readonly = false }: Props) {
  return (
    <div className="space-y-6">
      {SLOTS.map((slot) => {
        const items = plan.items.filter((i) => i.slot === slot).sort((a, b) => a.order - b.order)
        if (readonly && items.length === 0) return null

        return (
          <div key={slot}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SLOT_COLORS[slot]}`}>
                {SLOT_LABELS[slot]}
              </h3>
              {items.length > 0 && (
                <span className="text-xs text-gray-400 font-medium">{items.length} {items.length === 1 ? 'actividad' : 'actividades'}</span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
                Sin actividades para este horario
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <PlanItemCard
                    key={item.id}
                    item={item}
                    onRemove={onRemoveItem}
                    onFeedback={onFeedbackItem}
                    onSaveNote={onSaveNote}
                    onReorder={onReorderItem}
                    readonly={readonly}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
