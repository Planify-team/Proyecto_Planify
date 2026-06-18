import { Calendar, Star, Megaphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOrganizerStats, useOwnedEvents } from '@/hooks/useDashboard'
import Loading from '@/components/common/Loading'
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  finished: 'Finalizado',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-300/10 text-gray-500',
  published: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
  finished: 'bg-blue-500/15 text-blue-400',
}

export default function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useOrganizerStats()
  const { data: events, isLoading: eventsLoading } = useOwnedEvents()

  if (statsLoading || eventsLoading) return <Loading />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="h-7 w-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Panel de Organizador</h1>
      </div>

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
          <EmptyState
            title="Sin eventos registrados"
            description="Creá tu primer evento para verlo acá."
            icon={<Calendar className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/30 hover:shadow-neon-sm transition-all cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.start_date).toLocaleDateString('es-AR')} · {event.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.avg_rating != null && (
                    <span className="text-xs font-medium text-yellow-400">★ {event.avg_rating.toFixed(1)}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? 'bg-gray-300/10 text-gray-500'}`}>
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
