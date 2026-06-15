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

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
