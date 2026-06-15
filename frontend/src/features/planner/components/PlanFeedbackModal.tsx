import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { RatingStars } from '@/components/ui/RatingStars'
import { plannerService } from '@/services/plannerService'
import type { PlanItem } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  planId: string
  item: PlanItem | null
}

export function PlanFeedbackModal({ isOpen, onClose, planId, item }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setRating(0)
    setComment('')
    setDone(false)
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!item || rating === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await plannerService.submitFeedback(planId, {
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        rating,
        comment,
      })
      setDone(true)
    } catch {
      setError('No se pudo enviar el feedback. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const entityLabel = item
    ? item.entity_type === 'place' ? 'lugar' : item.entity_type === 'activity' ? 'actividad' : 'evento'
    : ''

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="¿Qué te pareció?" size="sm">
      {done ? (
        <div className="text-center py-4">
          <p className="text-green-600 font-medium text-lg">¡Gracias por tu feedback!</p>
          <p className="text-sm text-gray-500 mt-1">Tu opinión mejora las recomendaciones futuras.</p>
          <Button className="mt-4" onClick={handleClose}>Cerrar</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {item && (
            <p className="text-sm text-gray-600">
              Calificá este {entityLabel}
            </p>
          )}

          <div className="flex justify-center py-2">
            <RatingStars value={rating} onChange={setRating} size="lg" />
          </div>

          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Comentario opcional..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              isLoading={submitting}
            >
              Enviar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
