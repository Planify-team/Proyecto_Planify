import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, LogOut, Compass, Heart, Sparkles, Map, Settings, Menu, X, Bell, Tag, Search, CalendarDays, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import type { UserRole } from '@/types'

const NAV_LINKS = [
  { to: '/explorar',        label: 'Explorar',       icon: <Compass className="h-4 w-4" /> },
  { to: '/recomendaciones', label: 'Para vos',        icon: <Sparkles className="h-4 w-4" /> },
  { to: '/planner',         label: 'Planner',         icon: <CalendarDays className="h-4 w-4" /> },
  { to: '/mapa',            label: 'Mapa',            icon: <Map className="h-4 w-4" /> },
  { to: '/favoritos',       label: 'Favoritos',       icon: <Heart className="h-4 w-4" /> },
  { to: '/promociones',     label: 'Promociones',     icon: <Tag className="h-4 w-4" /> },
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const unreadCount = useUnreadCount()
  const dashboardLink = getDashboardLink(user?.role)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setSearchQuery('')
    }
  }

  const isActive = (to: string) => location.pathname === to

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary-600 text-xl flex-shrink-0">
            <MapPin className="h-6 w-6" />
            Planify
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {dashboardLink && (
                <Link
                  to={dashboardLink.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(dashboardLink.to)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {dashboardLink.icon}
                  {dashboardLink.label}
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lugares, eventos..."
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white w-56 transition-all"
            />
          </div>
        </form>

        {/* Desktop right */}
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/notificaciones"
                className={`hidden sm:flex relative p-1.5 rounded-lg transition-colors ${isActive('/notificaciones') ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/configuracion"
                className={`hidden sm:flex p-1.5 rounded-lg transition-colors ${isActive('/configuracion') ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                aria-label="Configuración"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 hover:text-primary-600 text-sm text-gray-700 transition-colors"
              >
                <Avatar name={user?.full_name} size="sm" src={user?.profile_image || undefined} />
                <span className="hidden sm:inline">{user?.first_name}</span>
              </button>
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
              {/* Mobile hamburger */}
              <button
                className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menú"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium">
                Ingresar
              </Link>
              <Button size="sm" onClick={() => navigate('/register')}>
                Registrarse
              </Button>
            </>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to) ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {dashboardLink && (
            <Link
              to={dashboardLink.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(dashboardLink.to) ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {dashboardLink.icon}
              {dashboardLink.label}
            </Link>
          )}
          <Link
            to="/notificaciones"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/notificaciones') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/recordatorios"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/recordatorios') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell className="h-4 w-4" />
            Recordatorios
          </Link>
          <Link
            to="/configuracion"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/configuracion') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
          <button
            onClick={() => { logout.mutate(); setMobileOpen(false) }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
