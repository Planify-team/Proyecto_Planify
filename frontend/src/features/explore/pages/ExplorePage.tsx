import { useState, useCallback, useEffect, useMemo } from 'react'
import { MapPin, Activity, Calendar, TrendingUp, Navigation, Filter, X, Globe, Compass, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlaces, usePlacesPaginated } from '@/hooks/usePlaces'
import { useActivitiesPaginated } from '@/hooks/useActivities'
import { useEventsPaginated } from '@/hooks/useEvents'
import { useTrending } from '@/hooks/useTrending'
import { useExternalPlaces } from '@/hooks/useExternalPlaces'
import PlaceCard from '@/components/ui/PlaceCard'
import ActivityCard from '@/components/ui/ActivityCard'
import EventCard from '@/components/ui/EventCard'
import SearchBar from '@/components/ui/SearchBar'
import EmptyState from '@/components/common/EmptyState'

type Tab = 'lugares' | 'actividades' | 'eventos' | 'cerca'

const ACTIVITY_TYPE_CHIPS = [
  { type: 'gaming',     emoji: '🎮', label: 'Gaming' },
  { type: 'sports',     emoji: '⚽', label: 'Deportes' },
  { type: 'cinema',     emoji: '🎬', label: 'Cine' },
  { type: 'concert',    emoji: '🎵', label: 'Música' },
  { type: 'museum',     emoji: '🏛️', label: 'Museos' },
  { type: 'park',       emoji: '🌳', label: 'Parques' },
  { type: 'restaurant', emoji: '🍽️', label: 'Gastronomía' },
  { type: 'bar',        emoji: '🍺', label: 'Bares' },
  { type: 'tourism',    emoji: '✈️', label: 'Turismo' },
  { type: 'shopping',   emoji: '🛍️', label: 'Shopping' },
]

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
interface ActivityFilters { category?: string; indoor?: boolean; outdoor?: boolean; free?: boolean; type?: string }
interface EventFilters { category?: string; date_from?: string; date_to?: string; free?: boolean }

export default function ExplorePage() {
  const location = useLocation()
  const initialType = (location.state as { activityType?: string } | null)?.activityType
  const [tab, setTab] = useState<Tab>('actividades')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const [placeFilters, setPlaceFilters] = useState<PlaceFilters>({})
  const [activityFilters, setActivityFilters] = useState<ActivityFilters>(() => ({ type: initialType }))
  const [eventFilters, setEventFilters] = useState<EventFilters>({})
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 when tab, search or filters change
  useEffect(() => { setPage(1) }, [tab, debouncedSearch, placeFilters, activityFilters, eventFilters])

  // Paginated queries for the three main tabs
  const places = usePlacesPaginated({
    page,
    name: tab === 'lugares' ? (debouncedSearch || undefined) : undefined,
    city: tab === 'lugares' ? (placeFilters.city || undefined) : undefined,
    category: tab === 'lugares' ? placeFilters.category : undefined,
    outdoor_seating: tab === 'lugares' ? placeFilters.outdoor_seating : undefined,
    fee: tab === 'lugares' ? placeFilters.fee : undefined,
    wheelchair: tab === 'lugares' ? placeFilters.wheelchair : undefined,
    cuisine: tab === 'lugares' ? placeFilters.cuisine : undefined,
  })

  const activities = useActivitiesPaginated({
    page,
    category: tab === 'actividades' ? (activityFilters.category || debouncedSearch || undefined) : undefined,
    indoor: tab === 'actividades' && activityFilters.indoor ? true : undefined,
    outdoor: tab === 'actividades' && activityFilters.outdoor ? true : undefined,
    free: tab === 'actividades' && activityFilters.free ? true : undefined,
    type: tab === 'actividades' ? activityFilters.type : undefined,
  })

  const events = useEventsPaginated({
    page,
    category: tab === 'eventos' ? (eventFilters.category || debouncedSearch || undefined) : undefined,
    date_from: tab === 'eventos' ? eventFilters.date_from : undefined,
    date_to: tab === 'eventos' ? eventFilters.date_to : undefined,
    free: tab === 'eventos' && eventFilters.free ? true : undefined,
  })

  // Nearby tab uses non-paginated (filtered by radius, always small result set)
  const nearbyPlaces = usePlaces(
    nearbyCoords ? { lat: nearbyCoords.lat, lon: nearbyCoords.lon, radius_km: 5 } : {},
  )
  const externalNearby = useExternalPlaces(
    nearbyCoords ? { lat: nearbyCoords.lat, lon: nearbyCoords.lon, radius: 3000 } : null,
  )
  const nearbyAll = useMemo(() => {
    const seen = new Set<string>()
    return [...(nearbyPlaces.data ?? []), ...(externalNearby.data ?? [])].filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [nearbyPlaces.data, externalNearby.data])

  const { data: trending } = useTrending()
  const showTrending = !search && tab !== 'cerca'

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'lugares', label: 'Lugares', icon: <MapPin className="h-4 w-4" aria-hidden="true" /> },
    { id: 'actividades', label: 'Actividades', icon: <Activity className="h-4 w-4" aria-hidden="true" /> },
    { id: 'eventos', label: 'Eventos', icon: <Calendar className="h-4 w-4" aria-hidden="true" /> },
    { id: 'cerca', label: 'Cerca de mí', icon: <Navigation className="h-4 w-4" aria-hidden="true" /> },
  ]

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Tu navegador no soporta geolocalización.'); return }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setNearbyCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGeoLoading(false) },
      () => { setGeoError('No pudimos obtener tu ubicación. Verificá los permisos del navegador.'); setGeoLoading(false) },
      { timeout: 8000 },
    )
  }, [])

  const activeFilterCount = tab === 'lugares'
    ? Object.values(placeFilters).filter((v) => v !== undefined && v !== false).length + (placeFilters.fee === false ? 1 : 0)
    : tab === 'actividades'
    ? Object.values(activityFilters).filter((v) => v !== undefined && v !== false).length
    : tab === 'eventos'
    ? Object.values(eventFilters).filter(Boolean).length
    : 0

  // Derived pagination info for active tab
  const activePaginated = tab === 'lugares' ? places : tab === 'actividades' ? activities : events
  const totalCount = activePaginated.data?.count ?? 0
  const totalPages = Math.ceil(totalCount / 30)
  const showPagination = tab !== 'cerca' && totalPages > 1

  return (
    <div className="flex flex-col gap-6">
      <title>Explorar | Planify</title>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-6 w-6 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Explorar</h1>
        </div>
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
            aria-expanded={showFilters}
            aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount} activos)` : ''}`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
              showFilters || activeFilterCount > 0
                ? 'border-primary-400/50 bg-primary-500/10 text-primary-600'
                : 'border-gray-200 text-gray-600 hover:bg-white/5'
            }`}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filter panels */}
      {showFilters && tab === 'lugares' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Categoría">
            <input type="text" value={placeFilters.category ?? ''} onChange={(e) => setPlaceFilters((f) => ({ ...f, category: e.target.value || undefined }))} placeholder="ej. cafe, museo" />
          </FilterRow>
          <FilterRow label="Tipo de cocina">
            <input type="text" value={placeFilters.cuisine ?? ''} onChange={(e) => setPlaceFilters((f) => ({ ...f, cuisine: e.target.value || undefined }))} placeholder="ej. pizza, sushi" />
          </FilterRow>
          <div className="flex flex-wrap gap-4">
            <CheckFilter label="Solo con terraza" checked={placeFilters.outdoor_seating ?? false} onChange={(v) => setPlaceFilters((f) => ({ ...f, outdoor_seating: v || undefined }))} />
            <CheckFilter label="Entrada gratuita" checked={placeFilters.fee === false} onChange={(v) => setPlaceFilters((f) => ({ ...f, fee: v ? false : undefined }))} />
            <CheckFilter label="Acceso en silla de ruedas" checked={placeFilters.wheelchair === 'yes'} onChange={(v) => setPlaceFilters((f) => ({ ...f, wheelchair: v ? 'yes' : undefined }))} />
          </div>
          <button onClick={() => setPlaceFilters({})} className="text-xs text-red-500 hover:underline self-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded">Limpiar filtros</button>
        </FilterPanel>
      )}
      {showFilters && tab === 'actividades' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Categoría">
            <input type="text" value={activityFilters.category ?? ''} onChange={(e) => setActivityFilters((f) => ({ ...f, category: e.target.value || undefined }))} placeholder="ej. música, deportes" />
          </FilterRow>
          <div className="flex flex-wrap gap-4">
            <CheckFilter label="Solo interior" checked={activityFilters.indoor ?? false} onChange={(v) => setActivityFilters((f) => ({ ...f, indoor: v || undefined }))} />
            <CheckFilter label="Solo exterior" checked={activityFilters.outdoor ?? false} onChange={(v) => setActivityFilters((f) => ({ ...f, outdoor: v || undefined }))} />
            <CheckFilter label="Gratuitas" checked={activityFilters.free ?? false} onChange={(v) => setActivityFilters((f) => ({ ...f, free: v || undefined }))} />
          </div>
          <button onClick={() => setActivityFilters({})} className="text-xs text-red-500 hover:underline self-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded">Limpiar filtros</button>
        </FilterPanel>
      )}
      {showFilters && tab === 'eventos' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Categoría">
            <input type="text" value={eventFilters.category ?? ''} onChange={(e) => setEventFilters((f) => ({ ...f, category: e.target.value || undefined }))} placeholder="ej. festival, teatro" />
          </FilterRow>
          <FilterRow label="Desde">
            <input type="date" value={eventFilters.date_from ?? ''} onChange={(e) => setEventFilters((f) => ({ ...f, date_from: e.target.value || undefined }))} />
          </FilterRow>
          <FilterRow label="Hasta">
            <input type="date" value={eventFilters.date_to ?? ''} onChange={(e) => setEventFilters((f) => ({ ...f, date_to: e.target.value || undefined }))} />
          </FilterRow>
          <CheckFilter label="Solo gratuitos" checked={eventFilters.free ?? false} onChange={(v) => setEventFilters((f) => ({ ...f, free: v || undefined }))} />
          <button onClick={() => setEventFilters({})} className="text-xs text-red-500 hover:underline self-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded">Limpiar filtros</button>
        </FilterPanel>
      )}

      {/* Trending */}
      {showTrending && trending && (
        <>
          {trending.places.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-gray-600">Lugares más populares</h2>
                </div>
                <button onClick={() => setTab('lugares')} className="text-xs text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded">
                  Ver todos
                </button>
              </div>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {trending.places.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/places/${p.id}`)} aria-label={p.name}
                      className="group flex-shrink-0 w-44 bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-28 bg-primary-100/40 flex items-center justify-center" aria-hidden="true"><MapPin className="h-8 w-8 text-primary-500" /></div>
                      )}
                      <div className="p-2"><p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p><p className="text-xs text-gray-400 truncate">{p.city}</p></div>
                    </button>
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          )}
          {trending.events.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-gray-600">Eventos más guardados</h2>
                </div>
                <button onClick={() => setTab('eventos')} className="text-xs text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded">
                  Ver todos
                </button>
              </div>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {trending.events.map((e) => (
                    <button key={e.id} onClick={() => navigate(`/events/${e.id}`)} aria-label={e.title}
                      className="group flex-shrink-0 w-44 bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
                      {e.image_url ? (
                        <img src={e.image_url} alt="" className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-28 bg-primary-100/40 flex items-center justify-center" aria-hidden="true"><Calendar className="h-8 w-8 text-primary-500" /></div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-900 truncate">{e.title}</p>
                        <p className="text-xs text-gray-400">{new Date(e.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setShowFilters(false) }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'lugares' && (
        <>
          <TabContent isLoading={places.isLoading} isEmpty={!places.data?.results?.length}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.data?.results.map((place) => <PlaceCard key={place.id} place={place} />)}
            </div>
          </TabContent>
          {showPagination && (
            <Pagination page={page} totalPages={totalPages} total={totalCount} onPageChange={setPage} isFetching={places.isFetching} />
          )}
        </>
      )}

      {tab === 'actividades' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {ACTIVITY_TYPE_CHIPS.map((chip) => (
              <button key={chip.type}
                onClick={() => setActivityFilters((f) => ({ ...f, type: f.type === chip.type ? undefined : chip.type }))}
                aria-pressed={activityFilters.type === chip.type}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  activityFilters.type === chip.type
                    ? 'bg-primary-600 text-white border-primary-500 shadow-neon-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-500/40 hover:text-primary-600'
                }`}
              >
                <span aria-hidden="true">{chip.emoji}</span>{chip.label}
              </button>
            ))}
          </div>
          <TabContent isLoading={activities.isLoading} isEmpty={!activities.data?.results?.length}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.data?.results.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
            </div>
          </TabContent>
          {showPagination && (
            <Pagination page={page} totalPages={totalPages} total={totalCount} onPageChange={setPage} isFetching={activities.isFetching} />
          )}
        </>
      )}

      {tab === 'eventos' && (
        <>
          <TabContent isLoading={events.isLoading} isEmpty={!events.data?.results?.length}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.data?.results.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </TabContent>
          {showPagination && (
            <Pagination page={page} totalPages={totalPages} total={totalCount} onPageChange={setPage} isFetching={events.isFetching} />
          )}
        </>
      )}

      {tab === 'cerca' && (
        <div>
          {!nearbyCoords && !geoLoading && (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="p-4 bg-primary-500/10 rounded-2xl border border-primary-400/20" aria-hidden="true">
                <Navigation className="h-12 w-12 text-primary-400" />
              </div>
              <p className="text-gray-800 font-semibold">Encontrá lugares a 3 km de vos</p>
              <p className="text-sm text-gray-500">Necesitamos acceso a tu ubicación para mostrarte lo que hay cerca.</p>
              {geoError && <div className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-2.5" role="alert">{geoError}</div>}
              <button onClick={requestGeolocation}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
                Usar mi ubicación
              </button>
            </div>
          )}
          {geoLoading && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center animate-pulse">
                <Navigation className="h-6 w-6 text-primary-500" aria-hidden="true" />
              </div>
              <p className="text-sm text-gray-500">Obteniendo tu ubicación…</p>
            </div>
          )}
          {nearbyCoords && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    Lugares dentro de 3 km · {nearbyAll.length} encontrados
                  </p>
                  {externalNearby.isLoading && (
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Globe className="h-3 w-3" aria-hidden="true" /> Buscando en OpenStreetMap…</p>
                  )}
                  {!externalNearby.isLoading && externalNearby.data && externalNearby.data.length > 0 && (
                    <p className="text-xs text-green-400 flex items-center gap-1"><Globe className="h-3 w-3" aria-hidden="true" /> {externalNearby.data.length} lugares de OpenStreetMap incluidos</p>
                  )}
                </div>
                <button onClick={() => setNearbyCoords(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded">
                  <X className="h-3 w-3" aria-hidden="true" /> Cambiar ubicación
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, total, onPageChange, isFetching,
}: {
  page: number; totalPages: number; total: number; onPageChange: (p: number) => void; isFetching: boolean
}) {
  const from = (page - 1) * 30 + 1
  const to = Math.min(page * 30, total)

  // Page numbers to show: always show first, last, and up to 3 around current
  const pageNums: (number | '...')[] = []
  const add = (n: number) => { if (!pageNums.includes(n)) pageNums.push(n) }
  add(1)
  if (page > 3) pageNums.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
  if (page < totalPages - 2) pageNums.push('...')
  if (totalPages > 1) add(totalPages)

  return (
    <nav aria-label="Paginación" className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{from}–{to}</span> de <span className="font-medium text-gray-700">{total}</span> resultados
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isFetching}
          aria-label="Página anterior"
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
        </button>

        <div className="flex items-center gap-1 mx-1">
          {pageNums.map((n, i) =>
            n === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <button
                key={n}
                onClick={() => onPageChange(n as number)}
                disabled={isFetching}
                aria-label={`Página ${n}`}
                aria-current={n === page ? 'page' : undefined}
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  n === page
                    ? 'bg-primary-600 text-white shadow-neon-sm'
                    : 'border border-gray-200 text-gray-600 hover:bg-white/5 disabled:opacity-40'
                }`}
              >
                {n}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isFetching}
          aria-label="Página siguiente"
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200/20" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200/20 rounded w-3/4" />
        <div className="h-3 bg-gray-200/20 rounded w-1/2" />
        <div className="h-3 bg-gray-200/20 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}

function TabContent({ isLoading, isEmpty, children }: { isLoading: boolean; isEmpty: boolean; children: React.ReactNode }) {
  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
  if (isEmpty) return <EmptyState title="Sin resultados" description="No encontramos nada con ese criterio. Probá con otro término." />
  return <>{children}</>
}

function FilterPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="bg-white border border-gray-200/30 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Filtros avanzados</span>
        <button onClick={onClose} aria-label="Cerrar filtros" className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded p-0.5">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 [&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-lg [&_input]:px-2.5 [&_input]:py-1.5 [&_input]:text-sm [&_input]:bg-gray-100 [&_input]:text-gray-800 [&_input]:outline-none [&_input:focus]:border-primary-500/50 [&_input:focus]:ring-2 [&_input:focus]:ring-primary-500/20">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-gray-200 text-primary-600 focus:ring-primary-500/40" />
      {label}
    </label>
  )
}
