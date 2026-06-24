import { useMemo } from 'react'
import { Bell, CheckCheck, Circle } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import EmptyState from '@/components/common/EmptyState'
import type { Notification } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  event_reminder: 'Recordatorio',
  system:         'Sistema',
  promotion:      'Promoción',
  recommendation: 'Recomendación',
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\[[0-9a-f-]{36}\]\s*$/i, '')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1)  return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead()

  return (
    <div
      className={`flex gap-4 p-4 rounded-xl border transition-colors ${
        notification.read
          ? 'bg-white border-gray-200'
          : 'bg-primary-500/10 border-primary-400/20'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {notification.read ? (
          <CheckCheck className="h-5 w-5 text-gray-400" />
        ) : (
          <Circle className="h-5 w-5 text-primary-500 fill-primary-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
            {cleanTitle(notification.title)}
          </p>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {timeAgo(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 bg-gray-300/10 px-2 py-0.5 rounded-full">
            {TYPE_LABELS[notification.notification_type] ?? notification.notification_type}
          </span>
          {!notification.read && (
            <button
              onClick={() => markRead.mutate(notification.id)}
              disabled={markRead.isPending}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
              aria-label={`Marcar como leída: ${cleanTitle(notification.title)}`}
            >
              Marcar como leída
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications()
  const markAll = useMarkAllNotificationsRead()

  const { unread, read } = useMemo(() => {
    const unread: typeof notifications = [], read: typeof notifications = []
    for (const n of notifications) {
      (n.read ? read : unread).push(n)
    }
    return { unread, read }
  }, [notifications])

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-200/20 rounded-full" />
          <div className="h-7 w-36 bg-gray-200/20 rounded" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 shadow-glass-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 fade-in-up">
      <title>Notificaciones | Planify</title>
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        {unread.length > 0 && (
          <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unread.length}
          </span>
        )}
        {unread.length > 1 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="ml-auto text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Sin notificaciones"
          description="Tus notificaciones aparecerán acá cuando las tengas."
          icon={<Bell className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {unread.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sin leer</h2>
              {unread.map((n) => <NotificationItem key={n.id} notification={n} />)}
            </section>
          )}
          {read.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leídas</h2>
              {read.map((n) => <NotificationItem key={n.id} notification={n} />)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
