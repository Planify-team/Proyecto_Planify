import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Users, DollarSign, ArrowRight, Compass, Heart, Cloud, CalendarDays, FolderOpen, ChevronRight, Globe, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useWeather } from '@/hooks/useWeather'
import { useForecast } from '@/hooks/useForecast'
import { usePlanner } from '@/hooks/usePlanner'
import { useMyPlans } from '@/hooks/useMyPlans'
import WeatherWidget from '@/components/ui/WeatherWidget'
import WeatherForecastWidget from '@/components/ui/WeatherForecastWidget'

const BA = { lat: -34.6037, lon: -58.3816 }

const TODAY = new Date().toISOString().split('T')[0]
const TODAY_LABEL = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', day: 'numeric', month: 'long',
})

const QUICK_ACTIONS = [
  { to: '/explorar',        icon: <Compass className="h-5 w-5 text-electric-cyan" />,  bg: 'bg-cyan-500/10',   label: 'Explorar' },
  { to: '/recomendaciones', icon: <Sparkles className="h-5 w-5 text-primary-600" />,   bg: 'bg-primary-500/10', label: 'Para vos' },
  { to: '/mis-planes',      icon: <FolderOpen className="h-5 w-5 text-violet-400" />,  bg: 'bg-violet-500/10', label: 'Mis Planes' },
  { to: '/favoritos',       icon: <Heart className="h-5 w-5 text-pink-400" />,         bg: 'bg-pink-500/10',   label: 'Favoritos' },
]

const ACTIVITY_SHORTCUTS = [
  { type: 'gaming',     emoji: '🎮', label: 'Gaming' },
  { type: 'sports',     emoji: '⚽', label: 'Deportes' },
  { type: 'cinema',     emoji: '🎬', label: 'Cine' },
  { type: 'concert',    emoji: '🎵', label: 'Música' },
  { type: 'museum',     emoji: '🏛️', label: 'Museos' },
  { type: 'park',       emoji: '🌳', label: 'Parques' },
  { type: 'restaurant', emoji: '🍽️', label: 'Gastronomía' },
  { type: 'bar',        emoji: '🍺', label: 'Bares' },
]

function getGreeting(firstName: string) {
  const h = new Date().getHours()
  if (h < 12) return `Buenos días, ${firstName}`
  if (h < 19) return `Buenas tardes, ${firstName}`
  return `Buenas noches, ${firstName}`
}

function formatPlanDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short',
  })
}

export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const planner = usePlanner()
  const { data: plans } = useMyPlans()

  const { data: weather, isLoading: weatherLoading } = useWeather(BA)
  const { data: forecast, isLoading: forecastLoading } = useForecast(BA)

  const [budget, setBudget] = useState('5000')
  const [people, setPeople] = useState('2')

  const handleGeneratePlan = () => {
    planner.mutate(
      { date: TODAY, budget, people_count: Number(people), city: 'Buenos Aires' },
      { onSuccess: (plan) => navigate(`/planes/${plan.id}`) },
    )
  }

  const recentPlans = plans ? [...plans].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 3) : []

  return (
    <div className="flex flex-col gap-8 pb-8">
      <title>Inicio | Planify</title>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting(user?.first_name ?? '')} 👋
          </h1>
          <p className="text-gray-500 text-sm capitalize mt-0.5">{TODAY_LABEL} · Buenos Aires</p>
        </div>
        {weatherLoading ? (
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 animate-pulse w-40 h-10" />
        ) : weather ? (
          <WeatherWidget weather={weather} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <Cloud className="h-4 w-4" aria-hidden="true" /> Buenos Aires
          </div>
        )}
      </div>

      {/* HERO — generar plan */}
      <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-neon ring-1 ring-violet-500/30">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-yellow-300" aria-hidden="true" />
          <span className="text-sm font-semibold text-indigo-200">Plan inteligente</span>
        </div>
        <h2 className="text-xl font-bold mb-4">¿Qué hacés hoy en Buenos Aires?</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="home-budget" className="text-xs text-indigo-200 flex items-center gap-1">
              <DollarSign className="h-3 w-3" aria-hidden="true" /> Presupuesto (ARS)
            </label>
            <input
              id="home-budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="5000"
              min="0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="home-people" className="text-xs text-indigo-200 flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" /> Personas
            </label>
            <input
              id="home-people"
              type="number"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              min="1"
              max="20"
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={planner.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-60 shadow-neon hover:shadow-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          {planner.isPending ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" aria-hidden="true" />
              Armando tu plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Generame un plan para hoy
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>

        {planner.isError && (
          <p className="text-xs text-red-300 mt-2 text-center">
            Error al generar el plan. Intentá de nuevo.
          </p>
        )}

        <p className="text-xs text-indigo-300 text-center mt-2">
          También podés ir al{' '}
          <button onClick={() => navigate('/planner')} className="underline hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded">
            planner completo
          </button>{' '}
          para elegir la fecha
        </p>
      </div>

      {/* ¿Qué querés hacer? */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">¿Qué querés hacer hoy?</h2>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITY_SHORTCUTS.map((s) => (
            <button
              key={s.type}
              onClick={() => navigate('/explorar', { state: { activityType: s.type } })}
              className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/40 hover:shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              <span className="text-xl" aria-hidden="true">{s.emoji}</span>
              <span className="text-xs font-medium text-gray-600">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Planes recientes */}
      {recentPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
              Tus últimos planes
            </h2>
            <button
              onClick={() => navigate('/mis-planes')}
              className="text-xs text-primary-600 hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded"
            >
              Ver todos <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => navigate(`/planes/${plan.id}`)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 group"
              >
                <div className="flex-shrink-0 w-10 text-center bg-primary-500/10 rounded-lg py-1">
                  <p className="text-base font-bold text-primary-600 leading-none">
                    {new Date(plan.date + 'T12:00:00').getDate()}
                  </p>
                  <p className="text-[9px] font-medium text-primary-500 uppercase">
                    {new Date(plan.date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">{plan.title}</p>
                  <p className="text-xs text-gray-500">
                    {plan.city} · {formatPlanDate(plan.date)}
                    {plan.items.length > 0 && ` · ${plan.items.length} actividades`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {plan.is_public ? (
                    <Globe className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pronóstico semanal */}
      {(forecastLoading || (forecast && forecast.length > 0)) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Pronóstico de la semana en BA</h2>
          <WeatherForecastWidget forecast={forecast} isLoading={forecastLoading} highlightDate={TODAY} />
        </div>
      )}

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          <CalendarDays className="inline h-4 w-4 mr-1 text-gray-400" aria-hidden="true" />
          Más opciones
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/40 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              <div className={`${a.bg} rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                {a.icon}
              </div>
              <span className="text-sm font-medium text-gray-600">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
