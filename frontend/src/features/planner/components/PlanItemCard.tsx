import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Star, ChevronUp, ChevronDown, MapPin, Zap, Calendar, Info, ExternalLink } from 'lucide-react'
import type { PlanItem } from '@/types'

interface Props {
  item: PlanItem
  onRemove?: (itemId: string) => void
  onFeedback?: (item: PlanItem) => void
  onSaveNote?: (itemId: string, note: string) => void
  onReorder?: (itemId: string, direction: 'up' | 'down') => void
  readonly?: boolean
}

const ENTITY_ICON: Record<string, React.ReactNode> = {
  place:    <MapPin className="h-4 w-4 text-blue-500" />,
  activity: <Zap className="h-4 w-4 text-purple-500" />,
  event:    <Calendar className="h-4 w-4 text-green-500" />,
}

const ENTITY_LABELS: Record<string, string> = {
  place: 'Lugar',
  activity: 'Actividad',
  event: 'Evento',
}

const ENTITY_BG: Record<string, string> = {
  place:    'bg-blue-500/10 border-blue-500/20',
  activity: 'bg-primary-500/10 border-primary-500/20',
  event:    'bg-green-500/10 border-green-500/20',
}

const ENTITY_PATH: Record<string, string> = {
  place: '/places',
  activity: '/activities',
  event: '/events',
}

export function PlanItemCard({ item, onRemove, onFeedback, onSaveNote, onReorder, readonly = false }: Props) {
  const navigate = useNavigate()
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(item.note)
  const [showDescription, setShowDescription] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const detailPath = item.entity_id && ENTITY_PATH[item.entity_type]
    ? `${ENTITY_PATH[item.entity_type]}/${item.entity_id}`
    : null

  useEffect(() => {
    if (editingNote && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingNote])

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitNote()
    else if (e.key === 'Escape') {
      setNoteValue(item.note)
      setEditingNote(false)
    }
  }

  const commitNote = () => {
    setEditingNote(false)
    if (noteValue !== item.note && onSaveNote) {
      onSaveNote(item.id, noteValue)
    }
  }

  const entityIcon = ENTITY_ICON[item.entity_type] ?? <MapPin className="h-4 w-4 text-gray-400" />
  const bgClass = ENTITY_BG[item.entity_type] ?? 'bg-gray-300/10 border-gray-200/50'

  return (
    <div className={`rounded-xl border p-4 shadow-glass-sm group ${bgClass}`}>
      <div className="flex items-start gap-3">
        {/* Reorder buttons */}
        {onReorder && (
          <div className="flex flex-col gap-0.5 pt-1 opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onReorder(item.id, 'up')} className="p-0.5 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/60 rounded" aria-label="Mover arriba">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onReorder(item.id, 'down')} className="p-0.5 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/60 rounded" aria-label="Mover abajo">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{entityIcon}</div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Type tag + category */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-gray-500">
              {ENTITY_LABELS[item.entity_type] || item.entity_type}
            </span>
            {item.entity_category && (
              <span className="text-xs text-gray-400">· {item.entity_category}</span>
            )}
          </div>

          {/* Name — the main thing the user needs to see */}
          {item.entity_name ? (
            detailPath ? (
              <button
                onClick={() => navigate(detailPath)}
                className="font-semibold text-gray-900 text-sm leading-snug hover:text-primary-600 flex items-center gap-1 group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
              >
                {item.entity_name}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-60 transition-opacity flex-shrink-0" />
              </button>
            ) : (
              <p className="font-semibold text-gray-900 text-sm leading-snug">{item.entity_name}</p>
            )
          ) : (
            <div className="h-4 w-32 bg-gray-300/30 rounded animate-pulse mt-0.5" />
          )}

          {/* Description toggle */}
          {item.entity_description && (
            <div className="mt-1">
              {showDescription ? (
                <p className="text-xs text-gray-600 leading-relaxed">{item.entity_description}</p>
              ) : null}
              <button
                onClick={() => setShowDescription((v) => !v)}
                aria-expanded={showDescription}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded"
              >
                <Info className="h-3 w-3" aria-hidden="true" />
                {showDescription ? 'Ocultar' : 'Ver más'}
              </button>
            </div>
          )}

          {/* Generation reason */}
          {item.generation_reason && (
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 flex-shrink-0 text-primary-400" />
              {item.generation_reason}
            </p>
          )}

          {/* Note */}
          {editingNote ? (
            <input
              ref={inputRef}
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              onBlur={commitNote}
              placeholder="Agregar nota..."
              className="mt-2 w-full text-sm border-b border-primary-500/50 focus:outline-none bg-transparent pb-0.5 text-gray-800 placeholder:text-gray-500"
            />
          ) : (
            <div
              onClick={() => !readonly && onSaveNote && setEditingNote(true)}
              onKeyDown={(e) => !readonly && onSaveNote && (e.key === 'Enter' || e.key === ' ') && setEditingNote(true)}
              role={!readonly && onSaveNote ? 'button' : undefined}
              tabIndex={!readonly && onSaveNote ? 0 : undefined}
              aria-label={!readonly && onSaveNote ? (item.note ? `Editar nota: ${item.note}` : 'Agregar nota') : undefined}
              className={`mt-1.5 text-sm min-h-[1rem] rounded px-1 -mx-1 ${
                !readonly && onSaveNote ? 'cursor-text hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40' : ''
              } ${item.note ? 'text-gray-600' : 'text-gray-400 italic'}`}
            >
              {item.note || (!readonly && onSaveNote ? 'Agregar nota...' : '')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onFeedback && (
            <button onClick={() => onFeedback(item)} className="p-1 text-gray-300 hover:text-yellow-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/60 rounded" aria-label={`Calificar: ${item.entity_name ?? 'ítem'}`} title="Dar feedback">
              <Star className="h-4 w-4" />
            </button>
          )}
          {!readonly && onRemove && (
            <button onClick={() => onRemove(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded" aria-label={`Quitar: ${item.entity_name ?? 'ítem'}`}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
