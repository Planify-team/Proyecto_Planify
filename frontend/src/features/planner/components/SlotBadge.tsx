import type { PlanSlot } from '@/types'

const SLOT_LABELS: Record<PlanSlot, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
}

const SLOT_COLORS: Record<PlanSlot, string> = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-blue-100 text-blue-800',
  evening: 'bg-purple-100 text-purple-800',
}

interface Props {
  slot: PlanSlot
  className?: string
}

export function SlotBadge({ slot, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SLOT_COLORS[slot]} ${className}`}>
      {SLOT_LABELS[slot]}
    </span>
  )
}
