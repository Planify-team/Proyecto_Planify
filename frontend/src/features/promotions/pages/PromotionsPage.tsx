import { Tag, MapPin, Calendar, Percent } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePromotions } from '@/hooks/usePromotions'
import EmptyState from '@/components/common/EmptyState'
import type { Promotion } from '@/types'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function PromotionCard({ promo }: { promo: Promotion }) {
  const navigate = useNavigate()
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden hover:shadow-neon-sm hover:border-primary-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      onClick={() => navigate(`/places/${promo.place}`)}
      role="button"
      tabIndex={0}
      aria-label={promo.title}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/places/${promo.place}`)}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-xl flex items-center gap-1">
          <Percent className="h-5 w-5" />
          {promo.discount_percentage}% OFF
        </span>
        <Tag className="h-5 w-5 text-white/80" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{promo.title}</h3>
        {promo.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{promo.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          {promo.place_name && (
            <span className="text-xs text-primary-600 flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3" />
              {promo.place_name}
            </span>
          )}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Hasta {formatDate(promo.end_date)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PromotionsPage() {
  const { data: promotions = [], isLoading } = usePromotions()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="space-y-1">
          <div className="h-7 w-36 bg-gray-200/20 rounded" />
          <div className="h-4 w-64 bg-gray-200/20 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-glass-sm overflow-hidden">
              <div className="h-12 bg-gray-200/20" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200/20 rounded w-3/4" />
                <div className="h-3 bg-gray-200/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Promociones | Planify</title>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary-600" />
          Promociones
        </h1>
        <p className="text-gray-500 text-sm">Descuentos y ofertas activas en lugares cercanos.</p>
      </div>

      {promotions.length === 0 ? (
        <EmptyState
          title="Sin promociones activas"
          description="Por el momento no hay promociones disponibles. Volvé más tarde."
          icon={<Tag className="h-8 w-8 text-gray-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <PromotionCard key={p.id} promo={p} />
          ))}
        </div>
      )}
    </div>
  )
}
