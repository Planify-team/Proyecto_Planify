import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, Cloud, Home } from 'lucide-react'
import type { Activity } from '@/types'
import FavoriteButton from './FavoriteButton'
import { RatingBadge } from './ReviewSection'

interface ActivityCardProps {
  activity: Activity
}

const typeLabels: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar', cinema: 'Cine', museum: 'Museo',
  park: 'Parque', sports: 'Deporte', concert: 'Concierto', gaming: 'Juegos',
  tourism: 'Turismo', shopping: 'Shopping',
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/activities/${activity.id}`)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{activity.name}</h3>
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              {typeLabels[activity.activity_type] ?? activity.activity_type}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemId={activity.id} itemType="activity" />
          </div>
        </div>

        {activity.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
        )}

        {activity.avg_rating != null && (
          <div className="mt-2">
            <RatingBadge average={activity.avg_rating} count={activity.review_count} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {activity.min_budget === '0.00' ? 'Gratis' : `Desde $${activity.min_budget}`}
          </span>
          {activity.min_people > 1 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {activity.min_people}+ personas
            </span>
          )}
          {activity.indoor && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Home className="h-3 w-3" />
              Interior
            </span>
          )}
          {activity.outdoor && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              Exterior
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
