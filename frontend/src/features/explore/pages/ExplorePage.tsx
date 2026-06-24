import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { MapPin, TrendingUp, Navigation, Filter, X, Globe, Compass, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlaces } from '@/hooks/usePlaces'
import { useTrending } from '@/hooks/useTrending'
import { useExternalPlaces } from '@/hooks/useExternalPlaces'
import PlaceCard from '@/components/ui/PlaceCard'
import SearchBar from '@/components/ui/SearchBar'
import EmptyState from '@/components/common/EmptyState'

type Tab = 'lugares' | 'cerca'

const PAGE_SIZE = 24

// Category chips — keyword matching against place.category (case-insensitive)
const PLACE_CHIPS: { key: string; emoji: string; label: string; keywords: string[] }[] = [
  { key: 'entretenimiento', emoji: '🎮', label: 'Juegos',       keywords: ['entretenimiento', 'gaming', 'arcade', 'videojueg', 'juego', 'escape', 'simulac', 'casino', 'nightlife', 'boliche', 'ocio', 'tecnolog'] },
  { key: 'cultural',       emoji: '🏛️', label: 'Cultura',      keywords: ['museo', 'cultur', 'teatro', 'cine', 'arte', 'histori', 'ciencia', 'música', 'danza', 'tango'] },
  { key: 'gastronomia',    emoji: '🍽️', label: 'Gastronomía',  keywords: ['gastro', 'café', 'cafe', 'bar', 'restaurante', 'cafetería', 'feria'] },
  { key: 'deportes',       emoji: '⚽', label: 'Deportes',      keywords: ['deporte', 'deportiv', 'estadio', 'fútbol', 'futbol', 'club deportiv', 'aventura', 'trampolines', 'gimnasia', 'tiro'] },
  { key: 'naturaleza',     emoji: '🌳', label: 'Parques',       keywords: ['parque', 'plaza', 'naturaleza', 'verde', 'aire libre', 'espacios verdes'] },
  { key: 'shopping',       emoji: '🛍️', label: 'Shopping',     keywords: ['shopping', 'comercial', 'compras', 'paseo comercial'] },
  { key: 'turismo',        emoji: '✈️', label: 'Turismo',       keywords: ['turismo', 'turístic', 'monumento', 'arquitectura'] },
]

const ACTIVITY_TYPE_TO_CHIP: Record<string, string> = {
  gaming:     'entretenimiento',
  sports:     'deportes',
  cinema:     'cultural',
  concert:    'cultural',
  museum:     'cultural',
  park:       'naturaleza',
  restaurant: 'gastronomia',
  bar:        'gastronomia',
}

function matchesChip(category: string, chip: typeof PLACE_CHIPS[number]) {
  const lower = category.toLowerCase()
  return chip.keywords.some((kw) => lower.includes(kw))
}

interface PlaceFilters {
  outdoor_seating?: boolean
  fee?: boolean
  wheelchair?: string
  cuisine?: string
}

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('lugares')
  const [search, setSearch] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [placeFilters, setPlaceFilters] = useState<PlaceFilters>({})
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const chipContainerRef = useRef<HTMLDivElement>(null)

  // Pre-select chip when navigated from HomePage shortcuts
  useEffect(() => {
    const actType = (location.state as { activityType?: string } | null)?.activityType
    if (actType && ACTIVITY_TYPE_TO_CHIP[actType]) {
      setSelectedChip(ACTIVITY_TYPE_TO_CHIP[actType])
      setTab('lugares')
    }
  }, [location.state])

  // Auto-scroll chip bar to show the selected chip
  useEffect(() => {
    if (!selectedChip || !chipContainerRef.current) return
    const btn = chipContainerRef.current.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    if (btn) chipContainerRef.current.scrollLeft = btn.offsetLeft - 8
  }, [selectedChip])

  // Load all 225 internal places once — client-side filtering
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces({})

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(t)
  }, [search])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [tab, debouncedSearch, selectedChip, placeFilters])

  // Client-side filter + search
  const filteredPlaces = useMemo(() => {
    let result = allPlaces.filter((p) => p.source === 'internal')

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      )
    }

    if (selectedChip) {
      const chip = PLACE_CHIPS.find((c) => c.key === selectedChip)
      if (chip) result = result.filter((p) => matchesChip(p.category, chip))
    }

    if (placeFilters.outdoor_seating) result = result.filter((p) => p.outdoor_seating === true)
    if (placeFilters.fee === false)    result = result.filter((p) => p.fee === false)
    if (placeFilters.wheelchair === 'yes') result = result.filter((p) => p.wheelchair === 'yes')
    if (placeFilters.cuisine)          result = result.filter((p) => p.cuisine?.toLowerCase().includes(placeFilters.cuisine!.toLowerCase()))

    return result
  }, [allPlaces, debouncedSearch, selectedChip, placeFilters])

  // Client-side pagination
  const totalCount = filteredPlaces.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const pagedPlaces = useMemo(() =>
    filteredPlaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPlaces, page]
  )

  // Nearby tab
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
  const showTrending = !search && !selectedChip && tab === 'lugares'

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'lugares', label: 'Lugares', icon: <MapPin className="h-4 w-4" aria-hidden="true" /> },
    { id: 'cerca',   label: 'Cerca de mí', icon: <Navigation className="h-4 w-4" aria-hidden="true" /> },
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

  const activeFilterCount = Object.values(placeFilters).filter((v) => v !== undefined && v !== false).length
    + (placeFilters.fee === false ? 1 : 0)

  return (
    <div className="flex flex-col gap-6">
      <title>Explorar | Planify</title>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary-600 flex-shrink-0" aria-hidden="true" />
            Explorar
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Descubrí los mejores lugares de Buenos Aires.</p>
        </div>
      </div>

      {/* Search + filters — only on lugares tab */}
      {tab === 'lugares' && (
        <div className="flex gap-2 items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, barrio..."
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

      {/* Filter panel */}
      {showFilters && tab === 'lugares' && (
        <FilterPanel onClose={() => setShowFilters(false)}>
          <FilterRow label="Tipo de cocina">
            <input type="text" value={placeFilters.cuisine ?? ''} onChange={(e) => setPlaceFilters((f) => ({ ...f, cuisine: e.target.value || undefined }))} placeholder="ej. pizza, sushi" />
          </FilterRow>
          <div className="flex flex-wrap gap-4">
            <CheckFilter label="Solo con terraza" checked={placeFilters.outdoor_seating ?? false} onChange={(v) => setPlaceFilters((f) => ({ ...f, outdoor_seating: v || undefined }))} />
            <CheckFilter label="Entrada gratuita"  checked={placeFilters.fee === false}            onChange={(v) => setPlaceFilters((f) => ({ ...f, fee: v ? false : undefined }))} />
            <CheckFilter label="Silla de ruedas"   checked={placeFilters.wheelchair === 'yes'}     onChange={(v) => setPlaceFilters((f) => ({ ...f, wheelchair: v ? 'yes' : undefined }))} />
          </div>
          <button onClick={() => setPlaceFilters({})} className="text-xs text-red-500 hover:underline self-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded">Limpiar filtros</button>
        </FilterPanel>
      )}

      {/* Trending — only when no search/chip active */}
      {showTrending && trending?.places && trending.places.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-600">Más populares</h2>
            </div>
          </div>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {trending.places.map((p, i) => (
                <button key={p.id} onClick={() => navigate(`/places/${p.id}`)} aria-label={p.name}
                  style={{ animationDelay: `${i * 0.07}s` }}
                  className="group relative flex-shrink-0 w-40 sm:w-48 rounded-2xl overflow-hidden shadow-glass-sm hover:shadow-neon-sm transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 fade-in-up">
                  <div className="h-36 sm:h-44 relative">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      : <div className="w-full h-full bg-primary-100/40 flex items-center justify-center" aria-hidden="true"><MapPin className="h-8 w-8 text-primary-400" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-bold text-white truncate leading-tight">{p.name}</p>
                      <p className="text-[10px] text-white/70 truncate mt-0.5">{p.category.split('/')[0].trim()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="flex gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); setShowFilters(false) }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lugares tab */}
      {tab === 'lugares' && (
        <>
          {/* Category chips */}
          <div ref={chipContainerRef} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {PLACE_CHIPS.map((chip) => (
              <button key={chip.key}
                onClick={() => setSelectedChip(selectedChip === chip.key ? null : chip.key)}
                aria-pressed={selectedChip === chip.key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  selectedChip === chip.key
                    ? 'bg-primary-600 text-white border-primary-500 shadow-neon-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-500/40 hover:text-primary-600'
                }`}
              >
                <span aria-hidden="true">{chip.emoji}</span>{chip.label}
              </button>
            ))}
          </div>

          {/* Results count when filtered */}
          {(selectedChip || debouncedSearch) && !placesLoading && (
            <p className="text-xs text-gray-500 -mt-2">
              {totalCount === 0 ? 'Sin resultados' : `${totalCount} lugar${totalCount !== 1 ? 'es' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
              {selectedChip && <button onClick={() => setSelectedChip(null)} className="ml-2 text-primary-500 hover:underline">Limpiar</button>}
            </p>
          )}

          <TabContent isLoading={placesLoading} isEmpty={pagedPlaces.length === 0}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
            </div>
          </TabContent>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={totalCount} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Cerca de mí tab */}
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

function Pagination({ page, totalPages, total, onPageChange }: {
  page: number; totalPages: number; total: number; onPageChange: (p: number) => void
}) {
  const from = (page - 1) * PAGE_SIZE + 1
  const to   = Math.min(page * PAGE_SIZE, total)

  const pageNums: (number | '...')[] = []
  const add = (n: number) => { if (!pageNums.includes(n)) pageNums.push(n) }
  add(1)
  if (page > 3) pageNums.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
  if (page < totalPages - 2) pageNums.push('...')
  if (totalPages > 1) add(totalPages)

  return (
    <nav aria-label="Paginación" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{from}–{to}</span> de <span className="font-medium text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          aria-label="Página anterior"
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
        </button>
        <div className="flex items-center gap-1 mx-1">
          {pageNums.map((n, i) =>
            n === '...' ? (
              <span key={`e-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <button key={n} onClick={() => onPageChange(n as number)}
                aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined}
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  n === page ? 'bg-primary-600 text-white shadow-neon-sm' : 'border border-gray-200 text-gray-600 hover:bg-white/5'
                }`}>
                {n}
              </button>
            )
          )}
        </div>
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          aria-label="Página siguiente"
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
  if (isEmpty) return <EmptyState title="Sin resultados" description="No encontramos nada con ese criterio. Probá con otro término o limpié los filtros." />
  return <>{children}</>
}

function FilterPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="bg-white border border-gray-200/30 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Filtros</span>
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
    <label className="flex flex-col gap-1 [&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-lg [&_input]:px-2.5 [&_input]:py-1.5 [&_input]:text-sm [&_input]:bg-gray-100 [&_input]:text-gray-800 [&_input]:outline-none [&_input:focus]:border-primary-500/50 [&_input:focus]:ring-2 [&_input:focus]:ring-primary-500/20">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
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
