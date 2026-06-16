import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Globe, DollarSign, ArrowLeft, Clock, Wifi, TreePine, Ticket, Accessibility } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { usePlace } from '@/hooks/usePlaces'
import { usePromotions } from '@/hooks/usePromotions'
import ReviewSection from '@/components/ui/ReviewSection'
import { useEvents } from '@/hooks/useEvents'
import Loading from '@/components/common/Loading'
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
  const { data: events = [] } = useEvents()
  const placeEvents = events.filter((e) => e.place === id && e.status === 'published')

  if (isLoading) return <Loading />
  if (isError || !place) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500">Lugar no encontrado.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    )
  }

  const hasCoords = place.latitude && place.longitude
  const center: [number, number] = hasCoords
    ? [parseFloat(String(place.latitude)), parseFloat(String(place.longitude))]
    : [-34.6037, -58.3816]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {place.image_url && (
        <img src={place.image_url} alt={place.name} className="w-full h-56 object-cover rounded-xl" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              {place.category}
            </span>
            {place.price_level > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <DollarSign className="h-3 w-3" />
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
        <div className="bg-gray-50 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Información del lugar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Horario:</span>
              <span className="text-gray-800 truncate">
                {place.opening_hours || 'Sin información'}
                {place.is_open_now === true && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Abierto</span>
                )}
                {place.is_open_now === false && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Cerrado</span>
                )}
              </span>
            </div>
            {place.cuisine && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Tipo:</span>
                <span className="text-gray-800">{place.cuisine.replace(/;/g, ', ')}</span>
              </div>
            )}
            {place.fee !== null && (
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Entrada:</span>
                <span className="text-gray-800">{place.fee ? 'Paga' : 'Gratuita'}</span>
              </div>
            )}
            {place.outdoor_seating !== null && (
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Terraza:</span>
                <span className="text-gray-800">{place.outdoor_seating ? 'Sí' : 'No'}</span>
              </div>
            )}
            {place.internet_access !== null && (
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Wifi:</span>
                <span className="text-gray-800">{place.internet_access ? 'Disponible' : 'No'}</span>
              </div>
            )}
            {place.wheelchair && (
              <div className="flex items-center gap-2">
                <Accessibility className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Acceso:</span>
                <span className="text-gray-800">
                  {place.wheelchair === 'yes' ? 'Apto' : place.wheelchair === 'limited' ? 'Limitado' : 'No apto'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Dirección</p>
            <p className="text-sm font-medium text-gray-900 truncate">{place.address}, {place.city}</p>
          </div>
        </div>
        {place.phone && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Phone className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="text-sm font-medium text-gray-900">{place.phone}</p>
            </div>
          </div>
        )}
        {place.website && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Globe className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Sitio web</p>
              <a href={place.website} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 hover:underline truncate block">
                {place.website}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {hasCoords && (
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '200px' }}>
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
              <div key={p.id} className="flex items-center justify-between bg-green-50 rounded-xl p-3 border border-green-100">
                <div>
                  <p className="text-sm font-semibold text-green-800">{p.title}</p>
                  {p.description && <p className="text-xs text-green-600">{p.description}</p>}
                </div>
                <span className="text-green-700 font-bold text-sm flex-shrink-0 ml-3">
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
                className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200 hover:border-primary-300 transition-colors text-left"
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
