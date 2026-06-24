import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, Locate, Search, X } from 'lucide-react'
import { usePlaces } from '@/hooks/usePlaces'
import { useWeather } from '@/hooks/useWeather'
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

// Category → emoji mapping
const CATEGORY_EMOJI_MAP: { emoji: string; label: string; keywords: string[] }[] = [
  { emoji: '🍽️', label: 'Gastronomía', keywords: ['gastro', 'restaurante', 'comida', 'feria gastro'] },
  { emoji: '☕', label: 'Café',         keywords: ['café', 'cafe', 'cafetería'] },
  { emoji: '🍺', label: 'Bar',          keywords: ['bar', 'boliche', 'nightlife', 'disco', 'cerveza'] },
  { emoji: '🏛️', label: 'Cultura',     keywords: ['museo', 'cultur', 'histori', 'ciencia'] },
  { emoji: '🎭', label: 'Teatro',       keywords: ['teatro', 'danza', 'tango'] },
  { emoji: '🎬', label: 'Cine',         keywords: ['cine'] },
  { emoji: '🎨', label: 'Arte',         keywords: ['arte', 'galería', 'galeria'] },
  { emoji: '⚽', label: 'Deportes',     keywords: ['deporte', 'estadio', 'fútbol', 'futbol', 'club deportiv', 'gimnasia', 'natación'] },
  { emoji: '🏆', label: 'Aventura',     keywords: ['aventura', 'trampolines', 'tiro', 'paintball', 'karting'] },
  { emoji: '🌳', label: 'Parques',      keywords: ['parque', 'plaza', 'naturaleza', 'verde', 'reserva'] },
  { emoji: '🛍️', label: 'Shopping',    keywords: ['shopping', 'comercial', 'paseo comercial'] },
  { emoji: '🗺️', label: 'Turismo',     keywords: ['turismo', 'turístic', 'monumento', 'arquitectura'] },
  { emoji: '🎮', label: 'Gaming',       keywords: ['gaming', 'escape', 'arcade', 'entretenimiento', 'videojueg', 'simulac', 'casino', 'ocio'] },
  { emoji: '🎵', label: 'Música',       keywords: ['música', 'musica'] },
]

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase()
  for (const { emoji, keywords } of CATEGORY_EMOJI_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return emoji
  }
  return '📍'
}

function getCategoryLabel(category: string): string {
  const lower = category.toLowerCase()
  for (const { label, keywords } of CATEGORY_EMOJI_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return label
  }
  return 'Otros'
}

// Cache icons to avoid recreating on every render
const iconCache = new Map<string, L.DivIcon>()
function getCategoryIcon(category: string): L.DivIcon {
  const emoji = getCategoryEmoji(category)
  if (!iconCache.has(emoji)) {
    iconCache.set(
      emoji,
      L.divIcon({
        html: `<div style="background:white;border:2px solid rgba(124,58,237,0.5);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,0.2),0 0 0 1px rgba(124,58,237,0.08);cursor:pointer;">${emoji}</div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      }),
    )
  }
  return iconCache.get(emoji)!
}

const BUENOS_AIRES_CENTER: [number, number] = [-34.6037, -58.3816]

const EXCLUDED_CATEGORIES = new Set([
  'Salud', 'Educación', 'Alojamiento', 'Shopping', 'Servicios', 'Farmacia',
])

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 14) }, [center, map])
  return null
}

function BoundsWatcher({ onChange }: { onChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds()),
    zoomend: () => onChange(map.getBounds()),
    load:    () => onChange(map.getBounds()),
  })
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

  const [cityQuery, setCityQuery] = useState('')
  const [citySearching, setCitySearching] = useState(false)
  const [cityError, setCityError] = useState<string | null>(null)
  const [searchedCity, setSearchedCity] = useState<string | null>(null)

  const allPlacesWithCoords = useMemo(
    () => places.filter(
      (p) => p.source === 'internal' && p.latitude && p.longitude && !EXCLUDED_CATEGORIES.has(p.category)
    ),
    [places],
  )

  const visiblePlaces = useMemo(
    () =>
      mapBounds
        ? allPlacesWithCoords.filter((p) =>
            mapBounds.contains([parseFloat(String(p.latitude!)), parseFloat(String(p.longitude!))])
          )
        : allPlacesWithCoords.slice(0, 60),
    [allPlacesWithCoords, mapBounds],
  )

  // Unique categories present in visible places (for the legend)
  const legendItems = useMemo(() => {
    const seen = new Map<string, string>()
    for (const place of visiblePlaces) {
      const emoji = getCategoryEmoji(place.category)
      if (!seen.has(emoji)) seen.set(emoji, getCategoryLabel(place.category))
    }
    return Array.from(seen.entries()).map(([emoji, label]) => ({ emoji, label }))
  }, [visiblePlaces])

  const handleBoundsChange = useCallback((b: L.LatLngBounds) => setMapBounds(b), [])

  const locateUser = () => {
    if (!navigator.geolocation) { setLocError('Tu navegador no soporta geolocalización.'); return }
    setLocating(true)
    setLocError(null)
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
    try {
      const result = await geocodingService.geocode(q)
      if (!result) { setCityError('No se encontró esa ciudad. Probá con otro nombre.'); return }
      const coords: [number, number] = [result.lat, result.lon]
      setMapCenter(coords)
      setSearchedCity(result.city || result.display_name.split(',')[0])
      setCityQuery('')
    } catch {
      setCityError('Error al buscar la ciudad. Intentá de nuevo.')
    } finally {
      setCitySearching(false)
    }
  }

  const clearSearch = () => {
    setSearchedCity(null)
    setCityError(null)
  }

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
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" aria-hidden="true" />
            Mapa
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm truncate mt-0.5">
            {visiblePlaces.length} de {allPlacesWithCoords.length} lugares visibles
            {userPos && !searchedCity && <span className="text-primary-600"> · Tu ubicación activa</span>}
            {searchedCity && <span className="text-primary-600"> · {searchedCity}</span>}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={locateUser}
          isLoading={locating}
          leftIcon={<Locate className="h-4 w-4" aria-hidden="true" />}
        >
          <span className="hidden sm:inline">Mi ubicación</span>
          <span className="sm:hidden">Ubicación</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
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
        className="rounded-xl overflow-hidden border border-gray-200/30 shadow-glass-sm h-[50vh] md:h-[65vh]"
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
              icon={getCategoryIcon(place.category)}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryEmoji(place.category)}</span>
                    <strong style={{ fontSize: '13px', color: '#111' }}>{place.name}</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>
                    {place.category.split('/')[0].trim()}
                  </p>
                  {place.address && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>{place.address}</p>
                  )}
                  <button
                    onClick={() => navigate(`/places/${place.id}`)}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: '12px', color: '#7c3aed', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                    }}
                  >
                    Ver lugar →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      {legendItems.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {legendItems.map(({ emoji, label }) => (
            <span
              key={emoji}
              className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-500 shadow-glass-sm"
            >
              {emoji} {label}
            </span>
          ))}
        </div>
      )}

      {/* Card list: only shows places visible in current viewport */}
      {visiblePlaces.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">
            Mostrando {visiblePlaces.length} lugar{visiblePlaces.length !== 1 ? 'es' : ''} en esta área — zoom o mové el mapa para ver más.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {visiblePlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => navigate(`/places/${place.id}`)}
                aria-label={place.name}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <div className="bg-primary-500/10 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl" aria-hidden="true">
                  {getCategoryEmoji(place.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{place.name}</p>
                  <p className="text-xs text-gray-500">{place.city || '—'} · {place.category.split('/')[0].trim()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
