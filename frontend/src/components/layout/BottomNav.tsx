import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, Compass, CalendarDays, Map, MoreHorizontal, X,
  Sparkles, Heart, FolderOpen, Clock, Bell, Settings, LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import Avatar from '@/components/ui/Avatar'

const PRIMARY_NAV = [
  { to: '/',         icon: Home,         label: 'Inicio' },
  { to: '/explorar', icon: Compass,      label: 'Explorar' },
  { to: '/planner',  icon: CalendarDays, label: 'Planner' },
  { to: '/mapa',     icon: Map,          label: 'Mapa' },
]

const DRAWER_NAV = [
  { to: '/recomendaciones', icon: Sparkles,   label: 'Para vos',        hasCount: false },
  { to: '/favoritos',       icon: Heart,      label: 'Favoritos',       hasCount: false },
  { to: '/mis-planes',      icon: FolderOpen, label: 'Mis Planes',      hasCount: false },
  { to: '/recordatorios',   icon: Clock,      label: 'Recordatorios',   hasCount: false },
  { to: '/notificaciones',  icon: Bell,       label: 'Notificaciones',  hasCount: true  },
  { to: '/configuracion',   icon: Settings,   label: 'Configuración',   hasCount: false },
]

export default function BottomNav() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const logout = useLogout()
  const unreadCount = useUnreadCount()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  if (!isAuthenticated) return null

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-16 z-50 transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{ background: 'rgba(7,6,15,0.97)', backdropFilter: 'blur(24px)' }}
        aria-hidden={!drawerOpen}
      >
        <div className="rounded-t-2xl border-t border-white/10 px-4 pt-4 pb-6">
          {/* Profile strip */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/perfil"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 min-w-0"
            >
              <Avatar name={user?.full_name} size="sm" src={user?.profile_image || undefined} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-200 flex-shrink-0"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Secondary nav links */}
          <div className="grid grid-cols-2 gap-1">
            {DRAWER_NAV.map(({ to, icon: Icon, label, hasCount }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'text-primary-400 bg-primary-500/15'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
                {hasCount && unreadCount > 0 && (
                  <span className="ml-auto bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <button
            onClick={() => { logout.mutate(); setDrawerOpen(false) }}
            className="mt-3 w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/5"
        style={{
          background: 'rgba(7,6,15,0.92)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_NAV.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 flex-1 py-2 px-1 transition-colors touch-manipulation ${
                  active ? 'text-primary-500' : 'text-gray-500'
                }`}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" aria-hidden="true" />
                )}
                <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} aria-hidden="true" />
                <span className={`text-[10px] font-medium leading-none ${active ? 'font-semibold' : ''}`}>{label}</span>
              </Link>
            )
          })}

          {/* "Más" button */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-expanded={drawerOpen}
            aria-label={unreadCount > 0 && !drawerOpen ? `Más opciones de navegación (${unreadCount} notificaciones sin leer)` : 'Más opciones de navegación'}
            className={`relative flex flex-col items-center gap-0.5 flex-1 py-2 px-1 transition-colors touch-manipulation ${
              drawerOpen ? 'text-primary-500' : 'text-gray-500'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">Más</span>
            {unreadCount > 0 && !drawerOpen && (
              <span className="absolute top-1.5 right-[18%] bg-primary-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
