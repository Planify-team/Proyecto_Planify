import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useReviews, useCreateReview, useDeleteReview } from '@/hooks/useReviews'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import type { ReviewEntityType } from '@/types'

interface Props {
  entityType: ReviewEntityType
  entityId: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          aria-pressed={value === n}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-400/40'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${cls} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-400/30'}`}
        />
      ))}
    </div>
  )
}

export function RatingBadge({ average, count }: { average: number; count: number }) {
  if (count === 0) return null
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${average.toFixed(1)} de 5 (${count} ${count === 1 ? 'reseña' : 'reseñas'})`}
    >
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-sm font-semibold text-gray-900" aria-hidden="true">{average.toFixed(1)}</span>
      <span className="text-xs text-gray-500" aria-hidden="true">({count})</span>
    </div>
  )
}

export default function ReviewSection({ entityType, entityId }: Props) {
  const { user } = useAuthStore()
  const { data, isLoading } = useReviews(entityType, entityId)
  const createMutation = useCreateReview(entityType, entityId)
  const deleteMutation = useDeleteReview(entityType, entityId)

  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (stars === 0) return
    try {
      await createMutation.mutateAsync({ stars, text })
      setStars(0)
      setText('')
      setShowForm(false)
      toast.success('Reseña publicada')
    } catch {
      toast.error('No se pudo publicar la reseña')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      toast.success('Reseña eliminada')
    } catch {
      toast.error('No se pudo eliminar la reseña')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-24 bg-gray-200/20 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200/20" />
              <div className="space-y-1">
                <div className="h-3 w-24 bg-gray-200/20 rounded" />
                <div className="h-3 w-16 bg-gray-200/20 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-200/20 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const { rating, my_review, reviews } = data ?? { rating: { average: 0, count: 0 }, my_review: null, reviews: [] }
  const otherReviews = reviews.filter((r) => !user || r.user_email !== user.email)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reseñas</h2>
        {rating.count > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay value={Math.round(rating.average)} size="md" />
            <span className="text-sm font-bold text-gray-900">{rating.average.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'})</span>
          </div>
        )}
      </div>

      {user && !my_review && !showForm && (
        <Button variant="secondary" onClick={() => setShowForm(true)} className="w-fit text-sm">
          Escribir una reseña
        </Button>
      )}

      {user && showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-gray-100 rounded-xl p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Tu calificación</p>
          <StarPicker value={stars} onChange={setStars} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contá tu experiencia (opcional)..."
            aria-label="Contá tu experiencia (opcional)"
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none transition-all"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={stars === 0 || createMutation.isPending} className="text-sm">
              {createMutation.isPending ? 'Guardando...' : 'Publicar reseña'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-sm">
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {user && my_review && (
        <div className="bg-primary-100/30 rounded-xl p-4 border border-primary-400/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <StarDisplay value={my_review.stars} />
                <span className="text-xs font-medium text-primary-600">Tu reseña</span>
              </div>
              {my_review.text && <p className="text-sm text-gray-600">{my_review.text}</p>}
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded disabled:opacity-50"
              aria-label="Eliminar reseña"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {otherReviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {otherReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary-500/15 flex items-center justify-center text-xs font-semibold text-primary-600">
                    {review.user_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.user_name}</p>
                    <StarDisplay value={review.stars} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
              {review.text && <p className="text-sm text-gray-600">{review.text}</p>}
            </div>
          ))}
        </div>
      )}

      {rating.count === 0 && !showForm && (
        <p className="text-sm text-gray-400">Todavía no hay reseñas. ¡Sé el primero en opinar!</p>
      )}
    </div>
  )
}
