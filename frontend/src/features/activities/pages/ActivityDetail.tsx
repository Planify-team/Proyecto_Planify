import { useParams, useNavigate } from 'react-router-dom'
import { DollarSign, Users, MapPin, ArrowLeft, Tag } from 'lucide-react'
import { useActivity } from '@/hooks/useActivities'
import Loading from '@/components/common/Loading'
import Button from '@/components/ui/Button'
import FavoriteButton from '@/components/ui/FavoriteButton'
import ReviewSection from '@/components/ui/ReviewSection'

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar', cinema: 'Cine', museum: 'Museo',
  park: 'Parque', sports: 'Deporte', concert: 'Concierto', gaming: 'Juegos',
  tourism: 'Turismo', shopping: 'Shopping',
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: activity, isLoading, isError } = useActivity(id!)

  if (isLoading) return <Loading />
  if (isError || !activity) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500">Actividad no encontrada.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    )
  }

  const minBudget = parseFloat(activity.min_budget)
  const maxBudget = activity.max_budget ? parseFloat(activity.max_budget) : null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              {TYPE_LABELS[activity.activity_type] ?? activity.activity_type}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {activity.category}
            </span>
          </div>
        </div>
        <FavoriteButton itemId={activity.id} itemType="activity" />
      </div>

      {activity.description && (
        <p className="text-gray-600 leading-relaxed">{activity.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <DollarSign className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Presupuesto</p>
            <p className="text-sm font-medium text-gray-900">
              {minBudget === 0 ? 'Gratis' : `Desde $${activity.min_budget}`}
              {maxBudget && ` hasta $${activity.max_budget}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Users className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Personas</p>
            <p className="text-sm font-medium text-gray-900">
              {activity.min_people === 1 && !activity.max_people
                ? 'Sin límite'
                : `${activity.min_people}${activity.max_people ? `–${activity.max_people}` : '+'} personas`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Tag className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Modalidad</p>
            <p className="text-sm font-medium text-gray-900">
              {activity.indoor && activity.outdoor ? 'Interior y Exterior'
                : activity.indoor ? 'Interior'
                : activity.outdoor ? 'Exterior'
                : 'Sin especificar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Ciudad</p>
            <p className="text-sm font-medium text-gray-900 truncate">{activity.city || 'Buenos Aires'}</p>
          </div>
        </div>
      </div>

      <ReviewSection entityType="activity" entityId={activity.id} />
    </div>
  )
}
