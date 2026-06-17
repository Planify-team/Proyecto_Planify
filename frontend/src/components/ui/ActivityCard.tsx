import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, Cloud, Home, MapPin } from 'lucide-react'
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

const typeColors: Record<string, string> = {
  restaurant: 'from-orange-400 to-amber-500',
  bar: 'from-purple-500 to-violet-600',
  cinema: 'from-red-400 to-rose-500',
  museum: 'from-blue-400 to-indigo-500',
  park: 'from-green-400 to-emerald-500',
  sports: 'from-cyan-400 to-sky-500',
  concert: 'from-pink-400 to-fuchsia-500',
  gaming: 'from-violet-400 to-purple-600',
  tourism: 'from-teal-400 to-cyan-500',
  shopping: 'from-yellow-400 to-amber-500',
}

function isFree(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false
  return parseFloat(String(value)) === 0
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate()
  const gradient = typeColors[activity.activity_type] ?? 'from-primary-400 to-primary-600'

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/activities/${activity.id}`)}
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
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

        {activity.address && (
          <div className="flex items-start gap-1 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-500 leading-snug">
              <span className="block">{activity.address}</span>
              {activity.city && <span className="block text-gray-400">{activity.city}</span>}
            </span>
          </div>
        )}

        {activity.avg_rating != null && (
          <div className="mt-2">
            <RatingBadge average={activity.avg_rating} count={activity.review_count} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {isFree(activity.min_budget) ? 'Gratis' : `Desde $${Math.round(parseFloat(String(activity.min_budget))).toLocaleString('es-AR')}`}
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
