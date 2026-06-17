import { useState, useCallback } from 'react'
import { MapPin, Activity, Calendar, TrendingUp, Navigation, Filter, X, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlaces } from '@/hooks/usePlaces'
import { useActivities } from '@/hooks/useActivities'
import { useEvents } from '@/hooks/useEvents'
import { useTrending } from '@/hooks/useTrending'
import { useExternalPlaces } from '@/hooks/useExternalPlaces'
import PlaceCard from '@/components/ui/PlaceCard'
import ActivityCard from '@/components/ui/ActivityCard'
import EventCard from '@/components/ui/EventCard'
import SearchBar from '@/components/ui/SearchBar'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'

type Tab = 'lugares' | 'actividades' | 'eventos' | 'cerca'

interface PlaceFilters {
  city?: string
  category?: string
  lat?: number
  lon?: number
  radius_km?: number
  outdoor_seating?: boolean
  fee?: boolean
  wheelchair?: string
  cuisine?: string
}
interface ActivityFilters { category?: string; indoor?: boolean; outdoor?: boolean; free?: boolean }
interface EventFilters { category?: string; date_from?: string; date_to?: string; free?: boolean }

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('lugares')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  // Per-tab filter state
  const [placeFilters, setPlaceFilters] = useState<PlaceFilters>({})
  const [activityFilters, setActivityFilters] = useState<ActivityFilters>({})
  const [eventFilters, setEventFilters] = useState<EventFilters>({})
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const places = usePlaces({
    name: tab === 'lugares' ? (search || undefined) : undefined,
    city: tab === 'lugares' ? (placeFilters.city || undefined) : undefined,
    category: tab === 'lugares' ? placeFilters.category : undefined,
    outdoor_seating: tab === 'lugares' ? placeFilters.outdoor_seating : undefined,
    fee: tab === 'lugares' ? placeFilters.fee : undefined,
    wheelchair: tab === 'lugares' ? placeFilters.wheelchair : undefined,
    cuisine: tab === 'lugares' ? placeFilters.cuisine : undefined,
  })

  const activities = useActivities({
    category: tab === 'actividades' ? (activityFilters.category || search || undefined) : undefined,
    indoor: tab === 'actividades' && activityFilters.indoor ? true : undefined,
    outdoor: tab === 'actividades' && activityFilters.outdoor ? true : undefined,
    free: tab === 'actividades' && activityFilters.free ? true : undefined,
  })

  const events = useEvents({
    category: tab === 'eventos' ? (eventFilters.category || search || undefined) : undefined,
    date_from: tab === 'eventos' ? eventFilters.date_from : undefined,
    date_to: tab === 'eventos' ? eventFilters.date_to : undefined,
    free: tab === 'eventos' && eventFilters.free ? true : undefined,
  })

  const nearbyPlaces = usePlaces(
    nearbyCoords
      ? { lat: nearbyCoords.lat, lon: nearbyCoords.lon, radius_km: 5 }
      : {},
  )

  // Real OSM places from Overpass — fetched and upserted when user shares location
  const externalNearby = useExternalPlaces(
    nearbyCoords ? { lat: nearbyCoords.lat, lon: nearbyCoords.lon, radius: 3000 } : null,
  )

  // Merge internal + OSM places, deduplicated by id
  const nearbyAll = (() => {
    const seen = new Set<string>()
    const merged = [...(nearbyPlaces.data ?? []), ...(externalNearby.data ?? [])]
    return merged.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
  })()

  const { data: trending } = useTrending()
  const showTrending = !search && tab !== 'cerca'

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'lugares', label: 'Lugares', icon: <MapPin className="h-4 w-4" /> },
    { id: 'actividades', label: 'Actividades', icon: <Activity className="h-4 w-4" /> },
    { id: 'eventos', label: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
    { id: 'cerca', label: 'Cerca de mí', icon: <Navigation className="h-4 w-4" /> },
  ]

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearbyCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => {
        setGeoError('No pudimos obtener tu ubicación. Verificá los permisos del navegador.')
        setGeoLoading(false)
      },
    )
  }, [])

  const activeFilterCount = tab === 'lugares'
    ? Object.values(placeFilters).filter((v) => v !== undefined && v !== false).length
    + (placeFilters.fee === false ? 1 : 0)
    : tab === 'actividades'
    ? Object.values(activityFilters).filter((v) => v !== undefined && v !== false).length
    : tab === 'eventos'
    ? Object.values(eventFilters).filter(Boolean).length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Explorar</h1>
        <p className="text-gray-500 text-sm">Descubrí lugares, actividades y eventos cerca tuyo.</p>
      </div>

      {tab !== 'cerca' && (
        <div className="flex gap-2 items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={tab === 'lugares' ? 'Buscar por nombre...' : 'Buscar por categoría...'}
            className="flex-1 max-w-md"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && tab === 'lugares' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Ciudad">
            <input
              type="text"
              value={placeFilters.city ?? ''}
              onChange={(e) => setPlaceFilters((f) => ({ ...f, city: e.target.value || undefined }))}
              placeholder="ej. Buenos Aires"
              className="filter-input"
            />
          </FilterRow>
          <FilterRow label="Categoría">
            <input
              type="text"
              value={placeFilters.category ?? ''}
              onChange={(e) => setPlaceFilters((f) => ({ ...f, category: e.target.value || undefined }))}
              placeholder="ej. cafe, museo"
              className="filter-input"
            />
          </FilterRow>
          <FilterRow label="Tipo de cocina">
            <input
              type="text"
              value={placeFilters.cuisine ?? ''}
              onChange={(e) => setPlaceFilters((f) => ({ ...f, cuisine: e.target.value || undefined }))}
              placeholder="ej. pizza, sushi"
              className="filter-input"
            />
          </FilterRow>
          <div className="flex flex-wrap gap-4">
            <CheckFilter
              label="Solo con terraza"
              checked={placeFilters.outdoor_seating ?? false}
              onChange={(v) => setPlaceFilters((f) => ({ ...f, outdoor_seating: v || undefined }))}
            />
            <CheckFilter
              label="Entrada gratuita"
              checked={placeFilters.fee === false}
              onChange={(v) => setPlaceFilters((f) => ({ ...f, fee: v ? false : undefined }))}
            />
            <CheckFilter
              label="Acceso en silla de ruedas"
              checked={placeFilters.wheelchair === 'yes'}
              onChange={(v) => setPlaceFilters((f) => ({ ...f, wheelchair: v ? 'yes' : undefined }))}
            />
          </div>
          <button
            onClick={() => setPlaceFilters({})}
            className="text-xs text-red-500 hover:underline self-start"
          >
            Limpiar filtros
          </button>
        </FilterPanel>
      )}

      {showFilters && tab === 'actividades' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Categoría">
            <input
              type="text"
              value={activityFilters.category ?? ''}
              onChange={(e) => setActivityFilters((f) => ({ ...f, category: e.target.value || undefined }))}
              placeholder="ej. música, deportes"
              className="filter-input"
            />
          </FilterRow>
          <div className="flex flex-wrap gap-4">
            <CheckFilter
              label="Solo interior"
              checked={activityFilters.indoor ?? false}
              onChange={(v) => setActivityFilters((f) => ({ ...f, indoor: v || undefined }))}
            />
            <CheckFilter
              label="Solo exterior"
              checked={activityFilters.outdoor ?? false}
              onChange={(v) => setActivityFilters((f) => ({ ...f, outdoor: v || undefined }))}
            />
            <CheckFilter
              label="Gratuitas"
              checked={activityFilters.free ?? false}
              onChange={(v) => setActivityFilters((f) => ({ ...f, free: v || undefined }))}
            />
          </div>
          <button
            onClick={() => setActivityFilters({})}
            className="text-xs text-red-500 hover:underline self-start"
          >
            Limpiar filtros
          </button>
        </FilterPanel>
      )}

      {showFilters && tab === 'eventos' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Categoría">
            <input
              type="text"
              value={eventFilters.category ?? ''}
              onChange={(e) => setEventFilters((f) => ({ ...f, category: e.target.value || undefined }))}
              placeholder="ej. festival, teatro"
              className="filter-input"
            />
          </FilterRow>
          <FilterRow label="Desde">
            <input
              type="date"
              value={eventFilters.date_from ?? ''}
              onChange={(e) => setEventFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
              className="filter-input"
            />
          </FilterRow>
          <FilterRow label="Hasta">
            <input
              type="date"
              value={eventFilters.date_to ?? ''}
              onChange={(e) => setEventFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
              className="filter-input"
            />
          </FilterRow>
          <CheckFilter
            label="Solo gratuitos"
            checked={eventFilters.free ?? false}
            onChange={(v) => setEventFilters((f) => ({ ...f, free: v || undefined }))}
          />
          <button
            onClick={() => setEventFilters({})}
            className="text-xs text-red-500 hover:underline self-start"
          >
            Limpiar filtros
          </button>
        </FilterPanel>
      )}

      {/* Trending section */}
      {showTrending && trending && (
        <>
          {trending.places.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-700">Lugares más populares</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {trending.places.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/places/${p.id}`)}
                    className="flex-shrink-0 w-44 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-primary-50 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-primary-300" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.city}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {trending.events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-700">Eventos más guardados</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {trending.events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => navigate(`/events/${e.id}`)}
                    className="flex-shrink-0 w-44 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left"
                  >
                    {e.image_url ? (
                      <img src={e.image_url} alt={e.title} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-indigo-50 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-indigo-300" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-900 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(e.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setShowFilters(false) }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'lugares' && (
        <TabContent isLoading={places.isLoading} isEmpty={!places.data?.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.data?.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        </TabContent>
      )}

      {tab === 'actividades' && (
        <TabContent isLoading={activities.isLoading} isEmpty={!activities.data?.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.data?.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </TabContent>
      )}

      {tab === 'eventos' && (
        <TabContent isLoading={events.isLoading} isEmpty={!events.data?.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.data?.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </TabContent>
      )}

      {tab === 'cerca' && (
        <div>
          {!nearbyCoords && !geoLoading && (
            <div className="flex flex-col items-center py-16 gap-4">
              <Navigation className="h-12 w-12 text-primary-300" />
              <p className="text-gray-600 font-medium">Encontrá lugares a 5 km de vos</p>
              <p className="text-sm text-gray-400">Necesitamos acceso a tu ubicación</p>
              {geoError && <p className="text-sm text-red-500">{geoError}</p>}
              <button
                onClick={requestGeolocation}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Usar mi ubicación
              </button>
            </div>
          )}

          {geoLoading && <Loading message="Obteniendo tu ubicación..." />}

          {nearbyCoords && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-primary-600" />
                    Lugares dentro de 3 km · {nearbyAll.length} encontrados
                  </p>
                  {externalNearby.isLoading && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Buscando en OpenStreetMap…
                    </p>
                  )}
                  {!externalNearby.isLoading && externalNearby.data && externalNearby.data.length > 0 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {externalNearby.data.length} lugares de OpenStreetMap incluidos
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setNearbyCoords(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Cambiar ubicación
                </button>
              </div>
              <TabContent isLoading={nearbyPlaces.isLoading && externalNearby.isLoading} isEmpty={nearbyAll.length === 0}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyAll.map((place) => <PlaceCard key={place.id} place={place} />)}
                </div>
              </TabContent>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TabContent({
  isLoading,
  isEmpty,
  children,
}: {
  isLoading: boolean
  isEmpty: boolean
  children: React.ReactNode
}) {
  if (isLoading) return <Loading message="Cargando..." />
  if (isEmpty)
    return (
      <EmptyState
        title="Sin resultados"
        description="No encontramos nada con ese criterio. Probá con otro término."
      />
    )
  return <>{children}</>
}

function FilterPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Filtros avanzados</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <style>{`.filter-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 10px; font-size: 0.875rem; outline: none; background: white; } .filter-input:focus { border-color: #818cf8; box-shadow: 0 0 0 2px rgba(129,140,248,0.2); }`}</style>
      {children}
    </div>
  )
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-primary-600 focus:ring-primary-300"
      />
      {label}
    </label>
  )
}
