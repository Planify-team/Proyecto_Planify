import { Building2, Tag, Star, MapPin, Percent } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBusinessStats, useOwnedPlaces, useOwnedPromotions } from '@/hooks/useDashboard'
import EmptyState from '@/components/common/EmptyState'

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-glass-sm">
      <div className="p-2 bg-primary-500/10 rounded-lg text-primary-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useBusinessStats()
  const { data: places, isLoading: placesLoading } = useOwnedPlaces()
  const { data: promotions, isLoading: promoLoading } = useOwnedPromotions()

  if (statsLoading || placesLoading || promoLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-7 w-7 bg-gray-200/20 rounded-full" />
          <div className="h-7 w-40 bg-gray-200/20 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
        <div className="space-y-3 mb-8">
          <div className="h-5 w-24 bg-gray-200/20 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-gray-200/20 rounded" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <title>Panel de Negocio | Planify</title>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-7 w-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Panel de Negocio</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Lugares" value={stats?.total_places ?? 0} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Promociones activas" value={stats?.active_promotions ?? 0} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Reseñas recibidas" value={stats?.total_reviews ?? 0} icon={<Star className="h-5 w-5" />} />
        <StatCard
          label="Calificación promedio"
          value={stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : '-'}
          icon={<Star className="h-5 w-5 text-yellow-400" />}
        />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis lugares</h2>
        {!places || places.length === 0 ? (
          <EmptyState
            title="Sin lugares registrados"
            description="Registrá tu primer lugar para verlo acá."
            icon={<Building2 className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-2">
            {places.map(place => (
              <div key={place.id} onClick={() => navigate(`/places/${place.id}`)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/places/${place.id}`)} role="button" tabIndex={0} aria-label={place.name} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/30 hover:shadow-neon-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.city} · {place.category}</p>
                  </div>
                </div>
                {place.avg_rating != null && (
                  <span className="text-xs font-medium text-yellow-400">★ {place.avg_rating.toFixed(1)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis promociones</h2>
        {!promotions || promotions.length === 0 ? (
          <EmptyState
            title="Sin promociones"
            description="Creá una promoción para atraer más clientes."
            icon={<Tag className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-2">
            {promotions.map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-glass-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-green-500 flex items-center">
                      <Percent className="h-3 w-3" />{promo.discount_percentage}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{promo.title}</p>
                    <p className="text-xs text-gray-500">{promo.place_name}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  promo.is_currently_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-300/10 text-gray-500'
                }`}>
                  {promo.is_currently_active ? 'Activa' : promo.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
