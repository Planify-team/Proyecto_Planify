import { Calendar, Star, Megaphone } from 'lucide-react'
import { useOrganizerStats, useOwnedEvents } from '@/hooks/useDashboard'
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  finished: 'Finalizado',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  finished: 'bg-blue-100 text-blue-600',
}

export default function OrganizerDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useOrganizerStats()
  const { data: events, isLoading: eventsLoading } = useOwnedEvents()

  if (statsLoading || eventsLoading) return <Loading />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Organizador</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Eventos totales" value={stats?.total_events ?? 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Publicados" value={stats?.published_events ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Reseñas recibidas" value={stats?.total_reviews ?? 0} icon={<Star className="h-5 w-5" />} />
        <StatCard
          label="Calificación promedio"
          value={stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : '-'}
          icon={<Star className="h-5 w-5 text-yellow-400" />}
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis eventos</h2>
        {!events || events.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tenés eventos registrados.</p>
        ) : (
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.start_date).toLocaleDateString('es-AR')} · {event.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.avg_rating != null && (
                    <span className="text-xs font-medium text-yellow-600">★ {event.avg_rating.toFixed(1)}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
