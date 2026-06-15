import type { Plan, PlanSlot } from '@/types'
import { PlanItemCard } from './PlanItemCard'
import { SlotBadge } from './SlotBadge'

const SLOTS: PlanSlot[] = ['morning', 'afternoon', 'evening']

const SLOT_LABELS: Record<PlanSlot, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
}

interface Props {
  plan: Plan
  onRemoveItem?: (itemId: string) => void
  readonly?: boolean
}

export function ItineraryView({ plan, onRemoveItem, readonly = false }: Props) {
  return (
    <div className="space-y-6">
      {SLOTS.map((slot) => {
        const items = plan.items.filter((i) => i.slot === slot)

        return (
          <div key={slot}>
            <div className="flex items-center gap-2 mb-3">
              <SlotBadge slot={slot} />
              <h3 className="text-sm font-semibold text-gray-700">{SLOT_LABELS[slot]}</h3>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-2">Sin ítems en este horario</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <PlanItemCard
                    key={item.id}
                    item={item}
                    onRemove={onRemoveItem}
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
