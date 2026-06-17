import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MapPin, Activity, Calendar, CheckCircle, Navigation, DollarSign } from 'lucide-react'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useWeather } from '@/hooks/useWeather'
import FavoriteButton from '@/components/ui/FavoriteButton'
import WeatherWidget from '@/components/ui/WeatherWidget'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import type { Recommendation, ScoreBreakdown } from '@/types'

const BA_COORDS = { lat: -34.6037, lon: -58.3816 }

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(BA_COORDS)
  const [usingGeo, setUsingGeo] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setUsingGeo(true)
      },
      () => {
        setCoords(BA_COORDS)
        setUsingGeo(false)
      },
      { timeout: 5000, maximumAge: 60000 },
    )
  }, [])

  const { data: recommendations = [], isLoading } = useRecommendations(
    { lat: coords.lat, lon: coords.lon },
  )
  const { data: weather } = useWeather(coords)

  if (isLoading) return <Loading message="Generando recomendaciones..." fullPage />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            Para vos
          </h1>
          <p className="text-gray-500 text-sm">
            Recomendaciones personalizadas basadas en tus preferencias.
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Navigation className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-xs text-primary-600 font-medium">
              {usingGeo ? 'Usando tu ubicación actual' : 'Usando Buenos Aires como referencia'}
            </span>
          </div>
        </div>
        <WeatherWidget weather={weather} />
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          title="Sin recomendaciones todavía"
          description="Configurá tus preferencias para recibir sugerencias personalizadas de actividades, lugares y eventos."
          icon={<Sparkles className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Configurar mis preferencias', onClick: () => navigate('/perfil') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  )
}

function getReasonLabels(breakdown: ScoreBreakdown): string[] {
  const labels: string[] = []
  if (breakdown.preference >= 20)   labels.push('Coincide con tus gustos')
  if (breakdown.distance >= 5)      labels.push('Está cerca de vos')
  if (breakdown.weather > 0)        labels.push('Ideal para el clima actual')
  if (breakdown.time_of_day >= 5)   labels.push('Perfecto para este momento')
  if (breakdown.day_of_week >= 5)   labels.push('Ideal para hoy')
  if (breakdown.interaction > 0)    labels.push('Basado en tu historial')
  return labels.slice(0, 3)
}

function getScoreBadge(score: number) {
  if (score >= 70) return { label: 'Alta coincidencia', className: 'bg-green-100 text-green-700' }
  if (score >= 50) return { label: 'Buena opción', className: 'bg-primary-100 text-primary-700' }
  return { label: 'Sugerido', className: 'bg-gray-100 text-gray-600' }
}

function buildLocation(rec: Recommendation): { street: string; city: string } {
  if (rec.item_type === 'activity' && rec.activity_detail) {
    return { street: rec.activity_detail.address, city: rec.activity_detail.city }
  }
  if (rec.item_type === 'event' && rec.event_detail) {
    const street = rec.event_detail.place_address || rec.event_detail.place_name
    return { street, city: rec.event_detail.place_city }
  }
  if (rec.item_type === 'place' && rec.place_detail) {
    return { street: rec.place_detail.address, city: rec.place_detail.city }
  }
  return { street: '', city: '' }
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const navigate = useNavigate()
  const score = Math.round(parseFloat(rec.score))
  const badge = getScoreBadge(score)

  const name =
    rec.activity_detail?.name ??
    rec.event_detail?.title ??
    rec.place_detail?.name ??
    '—'

  const category =
    rec.activity_detail?.category ??
    rec.event_detail?.category ??
    rec.place_detail?.category ??
    ''

  const { street, city } = buildLocation(rec)

  const itemId = rec.activity ?? rec.event ?? rec.place ?? ''

  const icon =
    rec.item_type === 'activity' ? <Activity className="h-4 w-4" /> :
    rec.item_type === 'event' ? <Calendar className="h-4 w-4" /> :
    <MapPin className="h-4 w-4" />

  const typeLabel =
    rec.item_type === 'activity' ? 'Actividad' :
    rec.item_type === 'event' ? 'Evento' : 'Lugar'

  const detailPath =
    rec.item_type === 'activity' ? `/activities/${itemId}` :
    rec.item_type === 'event' ? `/events/${itemId}` :
    `/places/${itemId}`

  const reasonLabels = rec.score_breakdown ? getReasonLabels(rec.score_breakdown) : []

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => itemId && navigate(detailPath)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && itemId && navigate(detailPath)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            {icon}
            <span>{typeLabel}</span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          {category && (
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full mt-0.5 inline-block">
              {category}
            </span>
          )}
          {(street || city) && (
            <div className="flex items-start gap-1 mt-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-500 leading-snug">
                {street && <span className="block">{street}</span>}
                {city && <span className="block text-gray-400">{city}</span>}
              </span>
            </div>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Price / date meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-50 pt-2">
        {rec.item_type === 'activity' && rec.activity_detail && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
            {(rec.activity_detail.is_free || parseFloat(rec.activity_detail.min_budget) === 0)
              ? 'Gratis'
              : `Desde $${Math.round(parseFloat(rec.activity_detail.min_budget)).toLocaleString('es-AR')}`}
          </span>
        )}
        {rec.item_type === 'event' && rec.event_detail && (
          <>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              {new Date(rec.event_detail.start_date).toLocaleDateString('es-AR', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
              {parseFloat(rec.event_detail.price) === 0 ? 'Gratis' : `$${Math.round(parseFloat(rec.event_detail.price)).toLocaleString('es-AR')}`}
            </span>
          </>
        )}
        {rec.item_type === 'place' && rec.place_detail && rec.place_detail.price_level > 0 && (
          <span className="flex items-center gap-1">
            {'$'.repeat(rec.place_detail.price_level)}
            <span className="text-gray-300">{'$'.repeat(4 - rec.place_detail.price_level)}</span>
          </span>
        )}
      </div>

      {reasonLabels.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-500">Te lo recomendamos porque:</p>
          {reasonLabels.map((label) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>
      )}

      {!reasonLabels.length && rec.recommendation_reason && (
        <p className="text-xs text-gray-500 italic">{rec.recommendation_reason}</p>
      )}

      {itemId && rec.item_type && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary-600 font-medium">Ver detalle →</span>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemId={itemId} itemType={rec.item_type} />
          </div>
        </div>
      )}
    </div>
  )
}
