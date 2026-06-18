import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' }

export function RatingStars({ value, onChange, size = 'md', readOnly = false }: Props) {
  const cls = sizes[size]

  if (readOnly) {
    return (
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={`${value} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${cls} transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className="cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 rounded"
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
          aria-pressed={value === star}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
