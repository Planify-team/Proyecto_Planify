import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Globe, DollarSign, ArrowLeft, Clock, Wifi, TreePine, Ticket, Accessibility, Navigation } from 'lucide-react'
import { getCategoryImageUrl } from '@/lib/categoryImages'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { usePlace } from '@/hooks/usePlaces'
import { usePromotions } from '@/hooks/usePromotions'
import ReviewSection from '@/components/ui/ReviewSection'
import { useEvents } from '@/hooks/useEvents'
import Button from '@/components/ui/Button'
import FavoriteButton from '@/components/ui/FavoriteButton'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const priceLabels = ['', 'Económico', 'Moderado', 'Caro', 'Muy caro']

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: place, isLoading, isError } = usePlace(id!)
  const { data: promotions = [] } = usePromotions(id)
  const { data: events = [] } = useEvents(id ? { place: id } : {})
  const placeEvents = events.filter((e) => e.status === 'published')
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        <div className="h-4 w-12 bg-gray-200/20 rounded" />
        <div className="h-56 bg-gray-200/20 rounded-xl" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200/20 rounded" />
            <div className="h-5 w-24 bg-gray-200/20 rounded-full" />
          </div>
          <div className="h-9 w-9 bg-gray-200/20 rounded-full" />
        </div>
        <div className="h-16 bg-gray-200/20 rounded" />
        <div className="h-28 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }
  if (isError || !place) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-4">
        <div className="p-5 bg-primary-500/10 rounded-2xl border border-primary-400/20">
          <MapPin className="h-12 w-12 text-primary-400" />
        </div>
        <p className="text-lg font-semibold text-gray-800">Lugar no encontrado</p>
        <p className="text-sm text-gray-500 max-w-xs">Puede que haya sido eliminado o que no tengas acceso.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    )
  }

  const hasCoords = place.latitude && place.longitude
  const center: [number, number] = hasCoords
    ? [parseFloat(String(place.latitude)), parseFloat(String(place.longitude))]
    : [-34.6037, -58.3816]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <title>{place.name} | Planify</title>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      {(() => {
        const src = imgSrc ?? place.image_url ?? getCategoryImageUrl(place.category)
        return (
          <img
            src={src}
            alt={place.name}
            className="w-full h-56 object-cover rounded-xl"
            decoding="async"
            onError={() => setImgSrc(getCategoryImageUrl(place.category))}
          />
        )
      })()}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium">
              {place.category}
            </span>
            {place.price_level > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                {priceLabels[place.price_level]}
              </span>
            )}
          </div>
        </div>
        <FavoriteButton itemId={place.id} itemType="place" />
      </div>

      {place.description && (
        <p className="text-gray-600 leading-relaxed">{place.description}</p>
      )}

      {/* Enriched place info */}
      {(place.opening_hours || place.cuisine || place.fee !== null || place.outdoor_seating !== null || place.internet_access !== null || place.wheelchair) && (
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200/30 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-600">Información del lugar</h2>

          {/* Horario — fila completa, sin truncate */}
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <span className="text-gray-500">Horario: </span>
              <span className="text-gray-800 whitespace-pre-line">
                {place.opening_hours || 'Sin información'}
              </span>
              {place.is_open_now === true && (
                <span className="ml-2 text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full inline-block">Abierto ahora</span>
              )}
              {place.is_open_now === false && (
                <span className="ml-2 text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full inline-block">Cerrado ahora</span>
              )}
            </div>
          </div>

          {/* Resto de campos en grilla */}
          {(place.cuisine || place.fee !== null || place.outdoor_seating !== null || place.internet_access !== null || place.wheelchair) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {place.cuisine && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tipo de cocina:</span>
                  <span className="text-gray-800">{place.cuisine.replace(/;/g, ', ')}</span>
                </div>
              )}
              {place.fee !== null && (
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-500">Entrada:</span>
                  <span className="text-gray-800">{place.fee ? 'Paga' : 'Gratuita'}</span>
                </div>
              )}
              {place.outdoor_seating !== null && (
                <div className="flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-500">Terraza:</span>
                  <span className="text-gray-800">{place.outdoor_seating ? 'Sí' : 'No'}</span>
                </div>
              )}
              {place.internet_access !== null && (
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-500">Wifi:</span>
                  <span className="text-gray-800">{place.internet_access ? 'Disponible' : 'No'}</span>
                </div>
              )}
              {place.wheelchair && (
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-500">Accesibilidad:</span>
                  <span className="text-gray-800">
                    {place.wheelchair === 'yes' ? 'Apto silla de ruedas' : place.wheelchair === 'limited' ? 'Acceso limitado' : 'No apto'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Dirección</p>
            <p className="text-sm font-medium text-gray-900 break-words">{place.address}, {place.city}</p>
          </div>
          {hasCoords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`}
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
        {place.phone && (
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
            <Phone className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <a href={`tel:${place.phone}`} className="text-sm font-medium text-primary-600 hover:underline">
                {place.phone}
              </a>
            </div>
          </div>
        )}
        {place.website && (
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
            <Globe className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-500">Sitio web</p>
              <a href={place.website} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 hover:underline break-all block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded">
                {place.website}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {hasCoords && (
        <div
          className="rounded-xl overflow-hidden border border-gray-200/30 h-[260px]"
          role="region"
          aria-label={`Mapa de ${place.name}`}
        >
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center}>
              <Popup>{place.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Promociones activas</h2>
          <div className="flex flex-col gap-2">
            {promotions.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                <div>
                  <p className="text-sm font-semibold text-green-400">{p.title}</p>
                  {p.description && <p className="text-xs text-green-400/70">{p.description}</p>}
                </div>
                <span className="text-green-400 font-bold text-sm flex-shrink-0 ml-3">
                  -{p.discount_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related events */}
      {placeEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Eventos en este lugar</h2>
          <div className="flex flex-col gap-2">
            {placeEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/events/${e.id}`)}
                className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200 shadow-glass-sm hover:border-primary-500/40 hover:shadow-neon-sm transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <p className="text-sm font-medium text-gray-900">{e.title}</p>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                  {new Date(e.start_date).toLocaleDateString('es-AR')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ReviewSection entityType="place" entityId={place.id} />
    </div>
  )
}
