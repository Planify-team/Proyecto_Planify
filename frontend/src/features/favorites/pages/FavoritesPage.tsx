import { useState, useMemo } from 'react'
import { Heart, Trash2, MapPin, Calendar, Zap, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites'
import EmptyState from '@/components/common/EmptyState'
import type { Favorite } from '@/types'

function getFavUrl(fav: Favorite): string | null {
  if (fav.item_type === 'place'    && fav.place)    return `/places/${fav.place}`
  if (fav.item_type === 'activity' && fav.activity) return `/activities/${fav.activity}`
  if (fav.item_type === 'event'    && fav.event)    return `/events/${fav.event}`
  return null
}

const typeConfig = {
  event:    { label: 'Evento',    icon: Calendar, border: 'border-l-violet-400', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  place:    { label: 'Lugar',     icon: MapPin,   border: 'border-l-blue-400',   bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  activity: { label: 'Actividad', icon: Zap,      border: 'border-l-amber-400',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
} as const

type FavItemType = keyof typeof typeConfig

type FilterTab = 'all' | FavItemType

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',      label: 'Todo' },
  { id: 'place',    label: 'Lugares' },
  { id: 'activity', label: 'Actividades' },
  { id: 'event',    label: 'Eventos' },
]

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { data: favorites = [], isLoading } = useFavorites()
  const remove = useRemoveFavorite()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const counts = useMemo(() => {
    const c = { all: favorites.length, place: 0, activity: 0, event: 0 }
    for (const f of favorites) {
      if (f.item_type === 'place') c.place++
      else if (f.item_type === 'activity') c.activity++
      else if (f.item_type === 'event') c.event++
    }
    return c
  }, [favorites])

  const visible = useMemo(
    () => activeTab === 'all' ? favorites : favorites.filter((f) => f.item_type === activeTab),
    [favorites, activeTab],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200/20 rounded-full" />
            <div className="h-7 w-36 bg-gray-200/20 rounded" />
          </div>
          <div className="h-4 w-56 bg-gray-200/20 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-300/30 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Mis favoritos | Planify</title>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-6 w-6 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Mis favoritos</h1>
        </div>
        <p className="text-gray-500 text-sm">Todo lo que guardaste para volver a ver.</p>
      </div>

      {/* Filter tabs */}
      {favorites.length > 0 && (
        <div role="tablist" className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const count = counts[tab.id]
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-t-md whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-primary-500/20 text-primary-600' : 'bg-gray-200/30 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          title="Sin favoritos aún"
          description="Explorá lugares, actividades y eventos, y tocá el corazón para guardarlos acá."
          icon={<Heart className="h-12 w-12 text-gray-300" />}
          action={{ label: 'Explorar lugares', onClick: () => navigate('/explorar') }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={`Sin ${FILTER_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} guardados`}
          description="Explorá y guardá algunos para verlos acá."
          icon={<Heart className="h-12 w-12 text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((fav, i) => {
            const config = fav.item_type ? typeConfig[fav.item_type as FavItemType] : null
            const Icon = config?.icon
            const url = getFavUrl(fav)
            return (
              <div
                key={fav.id}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`fade-in-up bg-white rounded-xl border border-gray-200 border-l-4 ${config?.border ?? 'border-l-gray-300'} shadow-glass-sm p-4 flex items-center gap-3 hover:shadow-neon-sm transition-all ${url ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40' : ''}`}
                onClick={() => url && navigate(url)}
                role={url ? 'button' : undefined}
                tabIndex={url ? 0 : undefined}
                onKeyDown={url ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(url) : undefined}
                aria-label={url ? (fav.item_name ?? undefined) : undefined}
              >
                {Icon && (
                  <div className={`${config?.bg} rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <Icon className={`h-4 w-4 ${config?.text}`} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{fav.item_name ?? '—'}</p>
                  {config && (
                    <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                  )}
                </div>
                {url && <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    remove.mutate(fav.id, {
                      onSuccess: () => toast.success(`${fav.item_name ?? 'Favorito'} eliminado`),
                      onError: () => toast.error('No se pudo eliminar el favorito'),
                    })
                  }}
                  disabled={remove.isPending}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-500/10 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  aria-label={`Eliminar ${fav.item_name ?? 'favorito'}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
