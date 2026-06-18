import { Heart, Trash2, MapPin, Calendar, Zap, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import type { Favorite } from '@/types'

function getFavUrl(fav: Favorite): string | null {
  if (fav.item_type === 'place' && fav.place) return `/places/${fav.place}`
  if (fav.item_type === 'activity' && fav.activity) return `/activities/${fav.activity}`
  if (fav.item_type === 'event' && fav.event) return `/events/${fav.event}`
  return null
}

const typeConfig = {
  event:    { label: 'Evento',     icon: Calendar, border: 'border-l-violet-400', bg: 'bg-violet-500/10',  text: 'text-violet-400' },
  place:    { label: 'Lugar',      icon: MapPin,   border: 'border-l-blue-400',   bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  activity: { label: 'Actividad',  icon: Zap,      border: 'border-l-amber-400',  bg: 'bg-amber-500/10',   text: 'text-amber-400' },
} as const

type FavItemType = keyof typeof typeConfig

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { data: favorites = [], isLoading } = useFavorites()
  const remove = useRemoveFavorite()

  if (isLoading) return <Loading message="Cargando favoritos..." />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mis favoritos</h1>
        </div>
        <p className="text-gray-500 text-sm">Todo lo que guardaste para volver a ver.</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="Sin favoritos aún"
          description="Explorá lugares, actividades y eventos, y tocá el corazón para guardarlos acá."
          icon={<Heart className="h-12 w-12 text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const config = fav.item_type ? typeConfig[fav.item_type as FavItemType] : null
            const Icon = config?.icon
            const url = getFavUrl(fav)
            return (
              <div
                key={fav.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${config?.border ?? 'border-l-gray-300'} shadow-glass-sm p-4 flex items-center gap-3 hover:shadow-neon-sm hover:border-r-primary-500/20 transition-all ${url ? 'cursor-pointer' : ''}`}
                onClick={() => url && navigate(url)}
              >
                {Icon && (
                  <div className={`${config?.bg} rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${config?.text}`} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{fav.item_name ?? '—'}</p>
                  {config && (
                    <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                  )}
                </div>
                {url && <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                <button
                  onClick={(e) => { e.stopPropagation(); remove.mutate(fav.id) }}
                  disabled={remove.isPending}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-500/10 flex-shrink-0"
                  aria-label="Eliminar favorito"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
