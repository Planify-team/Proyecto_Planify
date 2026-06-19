import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, Locate, Search, X } from 'lucide-react'
import { usePlaces } from '@/hooks/usePlaces'
import { useWeather } from '@/hooks/useWeather'
import { useExternalPlaces } from '@/hooks/useExternalPlaces'
import { geocodingService } from '@/services/geocodingService'
import Button from '@/components/ui/Button'
import WeatherWidget from '@/components/ui/WeatherWidget'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'user-marker-icon hue-rotate-[200deg]',
})

const BUENOS_AIRES_CENTER: [number, number] = [-34.6037, -58.3816]

const EXCLUDED_CATEGORIES = new Set([
  'Salud', 'Educación', 'Alojamiento', 'Shopping', 'Servicios', 'Farmacia',
])

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 14) }, [center, map])
  return null
}

// Fires onChange whenever the user pans or zooms, keeping bounds in sync
function BoundsWatcher({ onChange }: { onChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds()),
    zoomend: () => onChange(map.getBounds()),
    load:    () => onChange(map.getBounds()),
  })
  // Emit initial bounds once mounted
  useEffect(() => { onChange(map.getBounds()) }, [map, onChange])
  return null
}

export default function MapPage() {
  const navigate = useNavigate()
  const { data: places = [], isLoading } = usePlaces()
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(BUENOS_AIRES_CENTER)
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)
  const weatherCoords = userPos ? { lat: userPos[0], lon: userPos[1] } : null
  const { data: weather } = useWeather(weatherCoords)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const didAutoLocate = useRef(false)

  const [cityQuery, setCityQuery] = useState('')
  const [citySearching, setCitySearching] = useState(false)
  const [cityError, setCityError] = useState<string | null>(null)
  const [searchedCity, setSearchedCity] = useState<string | null>(null)
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)

  const externalCoords = searchCenter
    ? { lat: searchCenter[0], lon: searchCenter[1], radius: 2000 }
    : userPos
    ? { lat: userPos[0], lon: userPos[1], radius: 1500 }
    : null
  const { data: externalPlaces = [], isLoading: externalLoading } = useExternalPlaces(externalCoords)

  // All places with valid coordinates, de-duplicated
  const allPlacesWithCoords = [
    ...places.filter((p) => p.latitude && p.longitude && !EXCLUDED_CATEGORIES.has(p.category)),
    ...externalPlaces.filter(
      (p) => p.latitude && p.longitude && !EXCLUDED_CATEGORIES.has(p.category) && !places.find((ip) => ip.id === p.id),
    ),
  ]

  // Only render markers that are within the current map viewport
  const visiblePlaces = mapBounds
    ? allPlacesWithCoords.filter((p) =>
        mapBounds.contains([parseFloat(String(p.latitude!)), parseFloat(String(p.longitude!))])
      )
    : allPlacesWithCoords.slice(0, 60)

  const handleBoundsChange = useCallback((b: L.LatLngBounds) => setMapBounds(b), [])

  const locateUser = () => {
    if (!navigator.geolocation) { setLocError('Tu navegador no soporta geolocalización.'); return }
    setLocating(true)
    setLocError(null)
    setSearchCenter(null)
    setSearchedCity(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
        setMapCenter(coords)
        setLocating(false)
      },
      () => { setLocError('No se pudo obtener tu ubicación.'); setLocating(false) },
      { timeout: 8000 },
    )
  }

  const searchCity = async () => {
    const q = cityQuery.trim()
    if (!q) return
    setCitySearching(true)
    setCityError(null)
    const result = await geocodingService.geocode(q)
    setCitySearching(false)
    if (!result) { setCityError('No se encontró esa ciudad. Probá con otro nombre.'); return }
    const coords: [number, number] = [result.lat, result.lon]
    setSearchCenter(coords)
    setMapCenter(coords)
    setSearchedCity(result.city || result.display_name.split(',')[0])
    setCityQuery('')
  }

  const clearSearch = () => {
    setSearchCenter(null)
    setSearchedCity(null)
    setCityError(null)
  }

  useEffect(() => {
    if (!didAutoLocate.current) {
      didAutoLocate.current = true
      locateUser()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-200/20 rounded-full" />
              <div className="h-7 w-16 bg-gray-200/20 rounded" />
            </div>
            <div className="h-4 w-40 bg-gray-200/20 rounded" />
          </div>
        </div>
        <div className="flex-1 bg-gray-200/10 rounded-xl border border-gray-200/30 flex items-center justify-center min-h-[400px]">
          <MapPin className="h-12 w-12 text-gray-400/20" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <title>Mapa | Planify</title>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary-600" aria-hidden="true" />
            Mapa
          </h1>
          <p className="text-gray-500 text-sm">
            {visiblePlaces.length} de {allPlacesWithCoords.length} lugar{allPlacesWithCoords.length !== 1 ? 'es' : ''} visibles.
            {userPos && !searchedCity && <span className="text-primary-600 ml-1">· Tu ubicación activa</span>}
            {searchedCity && <span className="text-primary-600 ml-1">· {searchedCity}</span>}
            {externalLoading && <span className="text-gray-400 ml-1">· Cargando lugares de OpenStreetMap…</span>}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={locateUser}
          isLoading={locating}
          leftIcon={<Locate className="h-4 w-4" aria-hidden="true" />}
        >
          Mi ubicación
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCity()}
            placeholder="Buscar ciudad... (ej: Córdoba, Rosario)"
            aria-label="Buscar ciudad"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-gray-100 text-gray-800 rounded-lg text-sm focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 placeholder:text-gray-500"
          />
        </div>
        <Button size="sm" onClick={searchCity} isLoading={citySearching}>Buscar</Button>
        {searchedCity && (
          <button
            onClick={clearSearch}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      {locError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl" role="alert">{locError}</p>}
      {cityError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl" role="alert">{cityError}</p>}

      {userPos && !searchedCity && <WeatherWidget weather={weather} />}

      <div
        role="region"
        aria-label="Mapa interactivo de lugares"
        className="rounded-xl overflow-hidden border border-gray-200/30 shadow-glass-sm"
        style={{ height: '65vh' }}
      >
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={mapCenter} />
          <BoundsWatcher onChange={handleBoundsChange} />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup><strong>Tu ubicación</strong></Popup>
            </Marker>
          )}

          {visiblePlaces.map((place) => (
            <Marker
              key={place.id}
              position={[parseFloat(String(place.latitude!)), parseFloat(String(place.longitude!))]}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-gray-900">{place.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{place.category}</p>
                  {place.address && <p className="text-xs text-gray-400 mt-1">{place.address}</p>}
                  {place.source === 'osm' && <p className="text-xs text-green-400/70 mt-1">· OpenStreetMap</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Card list: only shows places visible in current viewport */}
      {visiblePlaces.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Mostrando {visiblePlaces.length} lugar{visiblePlaces.length !== 1 ? 'es' : ''} en esta área — zoom o mové el mapa para ver más.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visiblePlaces.map((place) => {
              const isInternal = place.source !== 'osm'
              return (
                <div
                  key={place.id}
                  className={`flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all ${isInternal ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40' : ''}`}
                  onClick={() => isInternal && navigate(`/places/${place.id}`)}
                  role={isInternal ? 'button' : undefined}
                  tabIndex={isInternal ? 0 : undefined}
                  aria-label={isInternal ? place.name : undefined}
                  onKeyDown={isInternal ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/places/${place.id}`) : undefined}
                >
                  <div className="bg-primary-500/10 rounded-lg p-2 flex-shrink-0" aria-hidden="true">
                    <MapPin className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.city || '—'} · {place.category}</p>
                  </div>
                  {place.source === 'osm' && <span className="text-xs text-gray-400 flex-shrink-0">OSM</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
