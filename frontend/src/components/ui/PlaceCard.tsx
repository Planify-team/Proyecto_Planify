import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign } from 'lucide-react'
import type { Place } from '@/types'
import FavoriteButton from './FavoriteButton'
import { RatingBadge } from './ReviewSection'

interface PlaceCardProps {
  place: Place
}

const priceLabels = ['', 'Económico', 'Moderado', 'Caro', 'Muy caro']

export default function PlaceCard({ place }: PlaceCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/places/${place.id}`)}
    >
      {place.image_url ? (
        <img src={place.image_url} alt={place.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-primary-50 flex items-center justify-center">
          <MapPin className="h-10 w-10 text-primary-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{place.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {place.city}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemId={place.id} itemType="place" />
          </div>
        </div>

        {place.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{place.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
            {place.category}
          </span>
          <div className="flex items-center gap-2">
            {place.avg_rating != null && (
              <RatingBadge average={place.avg_rating} count={place.review_count} />
            )}
            {place.price_level > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <DollarSign className="h-3 w-3" />
                {priceLabels[place.price_level] ?? ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
