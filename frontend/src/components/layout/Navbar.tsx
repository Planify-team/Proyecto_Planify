import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, LogOut, Compass, Heart, Sparkles, Map, Settings, Bell, Search, CalendarDays, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import type { UserRole } from '@/types'

const NAV_LINKS = [
  { to: '/planner',         label: 'Planner',   icon: <CalendarDays className="h-4 w-4" /> },
  { to: '/recomendaciones', label: 'Para vos',  icon: <Sparkles className="h-4 w-4" /> },
  { to: '/explorar',        label: 'Explorar',  icon: <Compass className="h-4 w-4" /> },
  { to: '/mapa',            label: 'Mapa',      icon: <Map className="h-4 w-4" /> },
  { to: '/favoritos',       label: 'Favoritos', icon: <Heart className="h-4 w-4" /> },
]

function getDashboardLink(role: UserRole | undefined) {
  if (role === 'business_owner' || role === 'admin' || role === 'moderator') {
    return { to: '/dashboard/business', label: 'Mi Negocio', icon: <LayoutDashboard className="h-4 w-4" /> }
  }
  if (role === 'event_organizer') {
    return { to: '/dashboard/organizer', label: 'Mis Eventos', icon: <LayoutDashboard className="h-4 w-4" /> }
  }
  return null
}

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const unreadCount = useUnreadCount()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: "/" focuses the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const dashboardLink = getDashboardLink(user?.role)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setSearchQuery('')
    }
  }

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <header className="sticky top-0 z-30 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0 neon-text">
            <MapPin className="h-6 w-6 text-primary-600" />
            Planify
          </Link>

          {isAuthenticated && (
            <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'text-primary-600 bg-primary-500/10 shadow-neon-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {dashboardLink && (
                <Link
                  to={dashboardLink.to}
                  aria-current={isActive(dashboardLink.to) ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(dashboardLink.to)
                      ? 'text-primary-600 bg-primary-500/10 shadow-neon-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/5'
                  }`}
                >
                  {dashboardLink.icon}
                  {dashboardLink.label}
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Search bar — desktop only */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar... (presioná /)"
              aria-label="Buscar"
              className="pl-9 pr-4 py-1.5 text-sm border border-white/10 rounded-lg bg-white/5 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/8 w-56 transition-all"
            />
          </div>
        </form>

        {/* Right section */}
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Search — mobile only, desktop uses the inline search bar */}
              <Link
                to="/search"
                className="flex md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </Link>
              {/* Bell visible on all sizes — mobile users see it in the top bar */}
              <Link
                to="/notificaciones"
                className={`relative p-1.5 rounded-lg transition-all ${
                  isActive('/notificaciones')
                    ? 'text-primary-600 bg-primary-500/10 shadow-neon-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/5'
                }`}
                aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 neon-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/configuracion"
                className={`hidden sm:flex p-1.5 rounded-lg transition-all ${
                  isActive('/configuracion')
                    ? 'text-primary-600 bg-primary-500/10 shadow-neon-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/5'
                }`}
                aria-label="Configuración"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <Link
                to="/perfil"
                className="flex items-center gap-2 hover:text-primary-600 text-sm text-gray-600 transition-colors"
              >
                <Avatar name={user?.full_name} size="sm" src={user?.profile_image || undefined} />
                <span className="hidden sm:inline">{user?.first_name}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                isLoading={logout.isPending}
                leftIcon={<LogOut className="h-4 w-4" />}
                className="hidden sm:flex"
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Ingresar
              </Link>
              <Button size="sm" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
