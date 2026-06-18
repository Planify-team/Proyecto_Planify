import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { useReviews, useCreateReview, useDeleteReview } from '@/hooks/useReviews'
import { useAuthStore } from '@/store/authStore'
import Loading from '@/components/common/Loading'
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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-400/30'}`}
        />
      ))}
    </div>
  )
}

export function RatingBadge({ average, count }: { average: number; count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="text-sm font-semibold text-gray-900">{average.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({count})</span>
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
    await createMutation.mutateAsync({ stars, text })
    setStars(0)
    setText('')
    setShowForm(false)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
  }

  if (isLoading) return <Loading message="Cargando reseñas..." />

  const { rating, my_review, reviews } = data ?? { rating: { average: 0, count: 0 }, my_review: null, reviews: [] }

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
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              title="Eliminar reseña"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {reviews.filter((r) => !user || r.user_email !== user.email).length > 0 && (
        <div className="flex flex-col gap-3">
          {reviews
            .filter((r) => !user || r.user_email !== user.email)
            .map((review) => (
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
