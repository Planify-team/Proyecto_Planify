import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Trash2, Calendar } from 'lucide-react'
import { useReminders, useRemoveReminder } from '@/hooks/useReminders'
import EmptyState from '@/components/common/EmptyState'
import Button from '@/components/ui/Button'
import type { Reminder } from '@/types'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function ReminderItem({ reminder }: { reminder: Reminder }) {
  const navigate = useNavigate()
  const remove = useRemoveReminder()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirming) {
      remove.mutate(reminder.id)
    } else {
      setConfirming(true)
    }
  }

  return (
    <div
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      onClick={() => navigate(`/events/${reminder.event}`)}
      role="button"
      tabIndex={0}
      aria-label={reminder.event_title}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/events/${reminder.event}`)}
    >
      <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bell className="h-5 w-5 text-primary-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{reminder.event_title}</p>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(reminder.reminder_date)}</span>
        </div>
      </div>

      <Button
        variant={confirming ? 'danger' : 'ghost'}
        size="sm"
        onClick={handleDelete}
        isLoading={remove.isPending}
        leftIcon={<Trash2 className="h-4 w-4" />}
        onBlur={() => setConfirming(false)}
      >
        {confirming ? 'Confirmar' : 'Eliminar'}
      </Button>
    </div>
  )
}

export default function RemindersPage() {
  const navigate = useNavigate()
  const { data: reminders = [], isLoading } = useReminders()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-200/20 rounded-full" />
          <div className="h-7 w-40 bg-gray-200/20 rounded" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">
      <title>Mis recordatorios | Planify</title>
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Mis recordatorios</h1>
        {reminders.length > 0 && (
          <span className="bg-gray-300/10 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
            {reminders.length}
          </span>
        )}
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          title="Sin recordatorios"
          description="Agregá recordatorios desde la página de un evento para no perderte nada."
          icon={<Bell className="h-8 w-8 text-gray-400" />}
          action={{ label: 'Explorar eventos', onClick: () => navigate('/explorar') }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {reminders.map((r) => (
            <ReminderItem key={r.id} reminder={r} />
          ))}
        </div>
      )}
    </div>
  )
}
