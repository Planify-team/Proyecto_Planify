import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Zap, DollarSign } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import EmptyState from '@/components/common/EmptyState'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQ = searchParams.get('q') ?? ''
  const [input, setInput] = useState(initialQ)
  const [query, setQuery] = useState(initialQ)

  const { data, isLoading } = useSearch(query)

  useEffect(() => {
    setInput(initialQ)
    setQuery(initialQ)
  }, [initialQ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (q) {
      setSearchParams({ q })
      setQuery(q)
    }
  }

  const total = (data?.places.length ?? 0) + (data?.activities.length ?? 0) + (data?.events.length ?? 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <title>{query ? `"${query}" | Buscar | Planify` : 'Buscar | Planify'}</title>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8" role="search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar lugares, actividades, eventos..."
            aria-label="Buscar lugares, actividades y eventos"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-100 text-gray-800 placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          Buscar
        </button>
      </form>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-gray-500 mb-6 min-h-[1.25rem]"
      >
        {query && (isLoading ? 'Buscando...' : `${total} resultado${total !== 1 ? 's' : ''} para "${query}"`)}
      </p>

      {isLoading && (
        <div data-testid="search-skeleton" className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-glass-sm">
              <div className="h-14 w-14 rounded-lg bg-gray-200/20 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-2/3 bg-gray-200/20 rounded" />
                <div className="h-3 w-1/3 bg-gray-200/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-8">
          {/* Places */}
          {data.places.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                <MapPin className="h-4 w-4 text-primary-600" />
                Lugares
              </h2>
              <div className="grid gap-3">
                {data.places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left w-full"
                  >
                    {place.image_url ? (
                      <img src={place.image_url} alt={place.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{place.name}</p>
                      <p className="text-xs text-gray-500">{place.city}</p>
                      <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                        {place.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Activities */}
          {data.activities.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                <Zap className="h-4 w-4 text-primary-600" />
                Actividades
              </h2>
              <div className="grid gap-3">
                {data.activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left w-full"
                  >
                    <div className="h-14 w-14 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-primary-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                      {activity.address ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {activity.address}{activity.city ? `, ${activity.city}` : ''}
                        </p>
                      ) : activity.city ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {activity.city}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                          {activity.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {parseFloat(String(activity.min_budget)) === 0 ? 'Gratis' : `Desde $${Math.round(parseFloat(String(activity.min_budget))).toLocaleString('es-AR')}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                <Calendar className="h-4 w-4 text-primary-600" />
                Eventos
              </h2>
              <div className="grid gap-3">
                {data.events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left w-full"
                  >
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-primary-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(event.start_date)}</p>
                      <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                        {event.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {total === 0 && query && (
            <EmptyState
              title={`Sin resultados para "${query}"`}
              description="Intentá con otra palabra clave o revisá la ortografía."
              icon={<Search className="h-10 w-10" />}
            />
          )}
        </div>
      )}

      {!query && (
        <EmptyState
          title="Buscá lo que quieras"
          description="Ingresá el nombre de un lugar, actividad o evento para encontrarlo."
          icon={<Search className="h-10 w-10" />}
        />
      )}
    </div>
  )
}
