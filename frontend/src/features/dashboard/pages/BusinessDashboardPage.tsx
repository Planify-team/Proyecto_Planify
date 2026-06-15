import { Building2, Tag, Star, MapPin } from 'lucide-react'
import { useBusinessStats, useOwnedPlaces, useOwnedPromotions } from '@/hooks/useDashboard'
import Loading from '@/components/common/Loading'

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
      <div className="p-2 bg-primary-50 rounded-lg text-primary-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function BusinessDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useBusinessStats()
  const { data: places, isLoading: placesLoading } = useOwnedPlaces()
  const { data: promotions, isLoading: promoLoading } = useOwnedPromotions()

  if (statsLoading || placesLoading || promoLoading) return <Loading />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Negocio</h1>

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
          <p className="text-sm text-gray-400 italic">No tenés lugares registrados.</p>
        ) : (
          <div className="space-y-2">
            {places.map(place => (
              <div key={place.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.city} · {place.category}</p>
                  </div>
                </div>
                {place.avg_rating != null && (
                  <span className="text-xs font-medium text-yellow-600">★ {place.avg_rating.toFixed(1)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis promociones</h2>
        {!promotions || promotions.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tenés promociones registradas.</p>
        ) : (
          <div className="space-y-2">
            {promotions.map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">{promo.title}</p>
                  <p className="text-xs text-gray-500">{promo.place_name}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  promo.is_currently_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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
