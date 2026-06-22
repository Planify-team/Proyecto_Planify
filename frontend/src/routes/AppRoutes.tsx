import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Route-level code splitting — each page loads only when first visited
const HomePage             = lazy(() => import('@/features/auth/pages/HomePage'))
const LoginPage            = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage         = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ProfilePage          = lazy(() => import('@/features/users/pages/ProfilePage'))
const ExplorePage          = lazy(() => import('@/features/explore/pages/ExplorePage'))
const FavoritesPage        = lazy(() => import('@/features/favorites/pages/FavoritesPage'))
const RecommendationsPage  = lazy(() => import('@/features/recommendations/pages/RecommendationsPage'))
const MapPage              = lazy(() => import('@/features/map/pages/MapPage'))
const ConfiguracionPage    = lazy(() => import('@/features/settings/pages/ConfiguracionPage'))
const OnboardingPage       = lazy(() => import('@/features/onboarding/pages/OnboardingPage'))
const NotificationsPage    = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const RemindersPage        = lazy(() => import('@/features/reminders/pages/RemindersPage'))
const EventDetail          = lazy(() => import('@/features/events/pages/EventDetail'))
const PlaceDetail          = lazy(() => import('@/features/places/pages/PlaceDetail'))
const ActivityDetail       = lazy(() => import('@/features/activities/pages/ActivityDetail'))
const PromotionsPage       = lazy(() => import('@/features/promotions/pages/PromotionsPage'))
const SearchResultsPage    = lazy(() => import('@/features/search/pages/SearchResultsPage'))
const PlannerPage          = lazy(() => import('@/features/planner/pages/PlannerPage'))
const MyPlansPage          = lazy(() => import('@/features/planner/pages/MyPlansPage'))
const PlanDetailPage       = lazy(() => import('@/features/planner/pages/PlanDetailPage'))
const PlanPublicPage       = lazy(() => import('@/features/planner/pages/PlanPublicPage'))
const BusinessDashboard    = lazy(() => import('@/features/dashboard/pages/BusinessDashboardPage'))
const OrganizerDashboard   = lazy(() => import('@/features/dashboard/pages/OrganizerDashboardPage'))
const NotFoundPage           = lazy(() => import('@/components/common/NotFoundPage'))
const ForgotPasswordPage     = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage      = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">Cargando...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/olvide-contrasena" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/restablecer-contrasena/:uid/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          </Route>

          <Route element={<MainLayout />}>
            <Route path="/"                element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/explorar"        element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
            <Route path="/recomendaciones" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/mapa"            element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/favoritos"       element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/perfil"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/configuracion"   element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
            <Route path="/notificaciones"  element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/recordatorios"   element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/promociones"     element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
            <Route path="/onboarding/preferencias" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/events/:id"      element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/places/:id"      element={<ProtectedRoute><PlaceDetail /></ProtectedRoute>} />
            <Route path="/activities/:id"  element={<ProtectedRoute><ActivityDetail /></ProtectedRoute>} />
            <Route path="/search"          element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
            <Route path="/planner"               element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
            <Route path="/mis-planes"            element={<ProtectedRoute><MyPlansPage /></ProtectedRoute>} />
            <Route path="/planes/:id"            element={<ProtectedRoute><PlanDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/business"    element={<ProtectedRoute><BusinessDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/organizer"   element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
          </Route>

          <Route path="/planes/p/:slug" element={<PlanPublicPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
