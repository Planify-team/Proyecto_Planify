import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import HomePage from '@/features/auth/pages/HomePage'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import ProfilePage from '@/features/users/pages/ProfilePage'
import ExplorePage from '@/features/explore/pages/ExplorePage'
import FavoritesPage from '@/features/favorites/pages/FavoritesPage'
import RecommendationsPage from '@/features/recommendations/pages/RecommendationsPage'
import MapPage from '@/features/map/pages/MapPage'
import ConfiguracionPage from '@/features/settings/pages/ConfiguracionPage'
import OnboardingPage from '@/features/onboarding/pages/OnboardingPage'
import NotificationsPage from '@/features/notifications/pages/NotificationsPage'
import RemindersPage from '@/features/reminders/pages/RemindersPage'
import EventDetail from '@/features/events/pages/EventDetail'
import PlaceDetail from '@/features/places/pages/PlaceDetail'
import ActivityDetail from '@/features/activities/pages/ActivityDetail'
import PromotionsPage from '@/features/promotions/pages/PromotionsPage'
import SearchResultsPage from '@/features/search/pages/SearchResultsPage'
import PlannerPage from '@/features/planner/pages/PlannerPage'
import MyPlansPage from '@/features/planner/pages/MyPlansPage'
import PlanDetailPage from '@/features/planner/pages/PlanDetailPage'
import PlanPublicPage from '@/features/planner/pages/PlanPublicPage'
import NotFoundPage from '@/components/common/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
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
        <Route path="/search"          element={<SearchResultsPage />} />
        <Route path="/planner"         element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
        <Route path="/mis-planes"      element={<ProtectedRoute><MyPlansPage /></ProtectedRoute>} />
        <Route path="/planes/:id"      element={<ProtectedRoute><PlanDetailPage /></ProtectedRoute>} />
      </Route>

      {/* Public plan page — no auth, no MainLayout */}
      <Route path="/planes/p/:slug" element={<PlanPublicPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
