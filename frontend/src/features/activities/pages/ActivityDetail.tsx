import { useParams, useNavigate } from 'react-router-dom'
import { DollarSign, Users, MapPin, ArrowLeft, Tag, Zap, ExternalLink, Navigation } from 'lucide-react'
import { useActivity } from '@/hooks/useActivities'
import Button from '@/components/ui/Button'
import FavoriteButton from '@/components/ui/FavoriteButton'
import ReviewSection from '@/components/ui/ReviewSection'

const TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar', cinema: 'Cine', museum: 'Museo',
  park: 'Parque', sports: 'Deporte', concert: 'Concierto', gaming: 'Juegos',
  tourism: 'Turismo', shopping: 'Shopping',
}

function formatBudget(val: string | number) {
  const n = parseFloat(String(val))
  if (n === 0) return 'Gratis'
  return `$${Math.round(n).toLocaleString('es-AR')}`
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: activity, isLoading, isError } = useActivity(id!)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        <div className="h-4 w-12 bg-gray-200/20 rounded" />
        <div className="h-52 bg-gray-200/20 rounded-xl" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200/20 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-gray-200/20 rounded-full" />
              <div className="h-5 w-16 bg-gray-200/20 rounded-full" />
            </div>
          </div>
          <div className="h-9 w-9 bg-gray-200/20 rounded-full" />
        </div>
        <div className="h-16 bg-gray-200/20 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }
  if (isError || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-4">
        <div className="p-5 bg-primary-500/10 rounded-2xl border border-primary-400/20">
          <Zap className="h-12 w-12 text-primary-400" aria-hidden="true" />
        </div>
        <p className="text-lg font-semibold text-gray-800">Actividad no encontrada</p>
        <p className="text-sm text-gray-500 max-w-xs">Puede que haya sido eliminada o que no tengas acceso.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    )
  }

  const minBudget = parseFloat(activity.min_budget)
  const maxBudget = activity.max_budget ? parseFloat(activity.max_budget) : null

  const googleMapsUrl = activity.latitude && activity.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`
    : activity.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address + (activity.city ? `, ${activity.city}` : ''))}`
    : null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <title>{activity.name} | Planify</title>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      {/* Hero image */}
      {activity.image_url && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={activity.image_url}
            alt={activity.name}
            className="w-full h-52 object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium">
              {TYPE_LABELS[activity.activity_type] ?? activity.activity_type}
            </span>
            <span className="text-xs bg-gray-300/10 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {activity.category}
            </span>
          </div>
        </div>
        <FavoriteButton itemId={activity.id} itemType="activity" />
      </div>

      {activity.description && (
        <p className="text-gray-600 leading-relaxed">{activity.description}</p>
      )}

      {/* Address + Maps link */}
      {(activity.address || activity.city) && (
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Dirección</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {[activity.address, activity.city].filter(Boolean).join(', ')}
            </p>
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
              aria-label="Ver en Google Maps"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              Maps
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <DollarSign className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Presupuesto</p>
            <p className="text-sm font-medium text-gray-900">
              {minBudget === 0 && !maxBudget
                ? 'Gratis'
                : maxBudget
                ? `${formatBudget(minBudget)} – ${formatBudget(maxBudget)}`
                : `Desde ${formatBudget(minBudget)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <Users className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Personas</p>
            <p className="text-sm font-medium text-gray-900">
              {activity.min_people === 1 && !activity.max_people
                ? 'Sin límite'
                : `${activity.min_people}${activity.max_people ? `–${activity.max_people}` : '+'} personas`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <Tag className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
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

        {!activity.address && (
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
            <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Ciudad</p>
              <p className="text-sm font-medium text-gray-900 truncate">{activity.city || 'Buenos Aires'}</p>
            </div>
          </div>
        )}
      </div>

      {/* External link */}
      {activity.external_url && (
        <a
          href={activity.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600/10 border border-primary-400/30 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-600/20 transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Más información
        </a>
      )}

      <ReviewSection entityType="activity" entityId={activity.id} />
    </div>
  )
}
