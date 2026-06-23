import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, MapPin, Users, ArrowLeft, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useEvent } from '@/hooks/useEvents'
import { usePromotions } from '@/hooks/usePromotions'
import { useCreateReminder } from '@/hooks/useReminders'
import Button from '@/components/ui/Button'
import FavoriteButton from '@/components/ui/FavoriteButton'
import ReviewSection from '@/components/ui/ReviewSection'
import { formatARS, localDateTimeString } from '@/lib/format'
import { useState } from 'react'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso)).replace(/^./, c => c.toUpperCase())
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado',  color: 'bg-green-500/15 text-green-400' },
  draft:     { label: 'Borrador',   color: 'bg-gray-300/10 text-gray-500' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-500/15 text-red-400' },
  finished:  { label: 'Finalizado', color: 'bg-yellow-500/15 text-yellow-400' },
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: event, isLoading, isError } = useEvent(id!)
  const { data: promotions = [] } = usePromotions(event?.place ?? undefined)
  const createReminder = useCreateReminder()
  const [reminderDate, setReminderDate] = useState('')

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        <div className="h-4 w-12 bg-gray-200/20 rounded" />
        <div className="h-56 bg-gray-200/20 rounded-xl" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-gray-200/20 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-gray-200/20 rounded-full" />
              <div className="h-5 w-16 bg-gray-200/20 rounded-full" />
            </div>
          </div>
          <div className="h-9 w-9 bg-gray-200/20 rounded-full" />
        </div>
        <div className="h-12 bg-gray-200/20 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }
  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-4">
        <div className="p-5 bg-primary-500/10 rounded-2xl border border-primary-400/20">
          <Calendar className="h-12 w-12 text-primary-400" />
        </div>
        <p className="text-lg font-semibold text-gray-800">Evento no encontrado</p>
        <p className="text-sm text-gray-500 max-w-xs">Puede que haya sido eliminado o que no tengas acceso.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    )
  }

  const statusInfo = STATUS_LABELS[event.status] ?? { label: event.status, color: 'bg-gray-300/10 text-gray-500' }
  const price = parseFloat(event.price)

  const handleReminder = async () => {
    if (!reminderDate) return
    try {
      await createReminder.mutateAsync({ eventId: event.id, reminderDate })
      setReminderDate('')
      toast.success('Recordatorio creado')
    } catch {
      toast.error('No se pudo crear el recordatorio')
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <title>{event.title} | Planify</title>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      {event.image_url ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-56 object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden h-36 bg-gradient-to-br from-green-900 via-teal-900 to-primary-900 flex items-center justify-center ring-1 ring-green-500/20">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-green-400/50 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-green-300/60 capitalize">{event.category}</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="text-xs bg-primary-500/15 text-primary-600 px-2 py-0.5 rounded-full font-medium capitalize">
              {event.category}
            </span>
          </div>
        </div>
        <FavoriteButton itemId={event.id} itemType="event" />
      </div>

      {event.description && (
        <p className="text-gray-600 leading-relaxed">{event.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <Calendar className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Inicio</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(event.start_date)}</p>
          </div>
        </div>
        {event.end_date && (
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
            <Clock className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-500">Fin</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(event.end_date)}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
          <DollarSign className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Precio</p>
            <p className="text-sm font-medium text-gray-900">{formatARS(price)}</p>
          </div>
        </div>
        {event.minimum_age > 0 && (
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30">
            <Users className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-500">Edad mínima</p>
              <p className="text-sm font-medium text-gray-900">+{event.minimum_age} años</p>
            </div>
          </div>
        )}
        {event.place_name && (
          event.place ? (
            <button
              type="button"
              onClick={() => navigate(`/places/${event.place}`)}
              aria-label={`Ver lugar: ${event.place_name}`}
              className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30 col-span-full sm:col-span-1 hover:border-primary-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 text-left w-full"
            >
              <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-gray-500">Lugar</p>
                <p className="text-sm font-medium text-primary-600 hover:underline">{event.place_name}</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3 border border-gray-200/30 col-span-full sm:col-span-1">
              <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-gray-500">Lugar</p>
                <p className="text-sm font-medium text-gray-900">{event.place_name}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Reminder */}
      {event.status === 'published' && (
        <div className="bg-primary-100/30 rounded-xl p-4 border border-primary-400/20">
          <h2 className="text-sm font-semibold text-primary-600 mb-2">Crear recordatorio</h2>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={localDateTimeString()}
              aria-label="Fecha y hora del recordatorio"
              className="flex-1 text-sm border border-gray-200 bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
            <Button
              size="sm"
              onClick={handleReminder}
              isLoading={createReminder.isPending}
              disabled={!reminderDate}
            >
              Recordar
            </Button>
          </div>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Promociones en este lugar</h2>
          <div className="flex flex-col gap-2">
            {promotions.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                <div>
                  <p className="text-sm font-semibold text-green-400">{p.title}</p>
                  <p className="text-xs text-green-400/70">{p.description}</p>
                </div>
                <span className="text-green-400 font-bold text-sm flex-shrink-0 ml-3">
                  -{p.discount_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReviewSection entityType="event" entityId={event.id} />
    </div>
  )
}
