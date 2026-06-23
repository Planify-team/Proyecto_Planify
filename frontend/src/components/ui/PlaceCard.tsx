import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, Wifi, TreePine, Ticket } from 'lucide-react'
import type { Place } from '@/types'
import FavoriteButton from './FavoriteButton'
import { RatingBadge } from './ReviewSection'
import { getCategoryImageUrl } from '@/lib/categoryImages'

interface PlaceCardProps {
  place: Place
}

const priceLabels = ['', 'Económico', 'Moderado', 'Caro', 'Muy caro']

export default function PlaceCard({ place }: PlaceCardProps) {
  const navigate = useNavigate()
  const [imgSrc, setImgSrc] = useState(place.image_url || getCategoryImageUrl(place.category))

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden hover:shadow-neon-sm hover:border-primary-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 touch-manipulation active:scale-[0.98]"
      onClick={() => navigate(`/places/${place.id}`)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/places/${place.id}`)}
      role="button"
      tabIndex={0}
      aria-label={place.name}
    >
      <div className="overflow-hidden h-28 sm:h-40">
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={() => setImgSrc(getCategoryImageUrl(place.category))}
        />
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{place.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              {place.city}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <FavoriteButton itemId={place.id} itemType="place" />
          </div>
        </div>

        {/* Description — only on sm+ */}
        {place.description && (
          <p className="hidden sm:block text-sm text-gray-600 mt-2 line-clamp-2">{place.description}</p>
        )}

        {/* Enriched badges — only on sm+ */}
        {(place.is_open_now !== null || place.outdoor_seating || place.fee === false || place.internet_access) && (
          <div className="hidden sm:flex flex-wrap gap-1 mt-2">
            {place.is_open_now === true && (
              <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">Abierto ahora</span>
            )}
            {place.is_open_now === false && (
              <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">Cerrado</span>
            )}
            {place.outdoor_seating && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TreePine className="h-3 w-3" aria-hidden="true" /> Con terraza
              </span>
            )}
            {place.fee === false && (
              <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Ticket className="h-3 w-3" aria-hidden="true" /> Entrada libre
              </span>
            )}
            {place.internet_access && (
              <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Wifi className="h-3 w-3" aria-hidden="true" /> Wifi
              </span>
            )}
          </div>
        )}

        {/* Category + rating — always visible */}
        <div className="flex items-center justify-between mt-2 gap-1">
          <span className="text-xs bg-primary-500/15 text-primary-600 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[55%]">
            {place.category}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {place.avg_rating != null && (
              <RatingBadge average={place.avg_rating} count={place.review_count} />
            )}
            {place.price_level > 0 && (
              <span className="hidden sm:flex text-xs text-gray-500 items-center gap-0.5">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                {priceLabels[place.price_level] ?? ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
