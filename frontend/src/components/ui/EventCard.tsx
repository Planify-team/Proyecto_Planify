import { useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, MapPin } from 'lucide-react'
import type { Event } from '@/types'
import FavoriteButton from './FavoriteButton'
import { RatingBadge } from './ReviewSection'

interface EventCardProps {
  event: Event
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {event.image_url ? (
        <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-primary-50 flex items-center justify-center">
          <Calendar className="h-10 w-10 text-primary-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              {formatDate(event.start_date)}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemId={event.id} itemType="event" />
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
            {event.category}
          </span>
          <div className="flex items-center gap-2">
            {event.avg_rating != null && (
              <RatingBadge average={event.avg_rating} count={event.review_count} />
            )}
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {parseFloat(event.price) === 0 ? 'Gratis' : `$${event.price}`}
            </span>
          </div>
        </div>

        {event.place_name && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.place_name}
          </p>
        )}
      </div>
    </div>
  )
}
