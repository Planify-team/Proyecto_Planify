import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Users, DollarSign, ArrowRight, Compass, Heart, Cloud, CalendarDays, FolderOpen, ChevronRight, Globe, Lock, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useWeather, useForecast } from '@/hooks/useWeather'
import { useMyPlans } from '@/hooks/usePlanner'
import { useRecommendations } from '@/hooks/useRecommendations'
import WeatherWidget from '@/components/ui/WeatherWidget'
import WeatherForecastWidget from '@/components/ui/WeatherForecastWidget'
import { localDateString } from '@/lib/format'
import { getCategoryImageUrl } from '@/lib/categoryImages'

const BA = { lat: -34.6037, lon: -58.3816 }

const TODAY = localDateString()
const TODAY_LABEL = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', day: 'numeric', month: 'long',
}).replace(/^./, c => c.toUpperCase())

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


export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: plans } = useMyPlans()

  const { data: weather, isLoading: weatherLoading } = useWeather(BA)
  const { data: forecast, isLoading: forecastLoading } = useForecast(BA)

  const [budget, setBudget] = useState('5000')
  const [people, setPeople] = useState('2')
  const [triggered, setTriggered] = useState(false)
  const [recFilters, setRecFilters] = useState<{ budget: number; people: number }>({ budget: 5000, people: 2 })

  const budgetDisplay = budget === '' ? '' : Number(budget).toLocaleString('es-AR')
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(e.target.value.replace(/\D/g, ''))
  }

  const { data: recommendations = [], isFetching: recLoading, isError: recError } = useRecommendations(
    { lat: BA.lat, lon: BA.lon, budget: recFilters.budget, people: recFilters.people },
    triggered,
  )
  const topRec = recommendations[0] ?? null

  const handleDiscover = () => {
    setRecFilters({ budget: Number(budget) || 5000, people: Number(people) || 2 })
    setTriggered(true)
  }

  const recentPlans = useMemo(
    () => (plans ? [...plans].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3) : []),
    [plans],
  )

  return (
    <div className="flex flex-col gap-8 pb-8 fade-in-up">
      <title>Inicio | Planify</title>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting(user?.first_name ?? '')}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{TODAY_LABEL} · Buenos Aires</p>
        </div>
        {weatherLoading ? (
          <div className="flex flex-col items-end gap-1">
            <div className="h-3 w-16 bg-gray-200/30 rounded animate-pulse" />
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 animate-pulse w-48 h-10" />
          </div>
        ) : weather ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-500 tracking-wide">Hoy · Buenos Aires</span>
            <WeatherWidget weather={weather} />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-500 tracking-wide">Hoy · Buenos Aires</span>
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <Cloud className="h-4 w-4" aria-hidden="true" /> Sin datos
            </div>
          </div>
        )}
      </div>

      {/* HERO — recomendación personalizada */}
      <div className="bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-neon border-2 border-violet-300/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-0.5 text-xs font-semibold text-indigo-200">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />
            Recomendación para vos
          </span>
        </div>
        <h2 className="text-xl font-bold mb-4 text-white">¿Qué hacés hoy en Buenos Aires?</h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-4">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="home-budget" className="text-xs text-indigo-200 flex items-center gap-1">
              <DollarSign className="h-3 w-3" aria-hidden="true" /> Presupuesto (ARS)
            </label>
            <input
              id="home-budget"
              type="text"
              inputMode="numeric"
              value={budgetDisplay}
              onChange={handleBudgetChange}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="5.000"
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-28">
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
          <button
            onClick={handleDiscover}
            disabled={recLoading}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-60 shadow-neon-sm hover:shadow-neon-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 whitespace-nowrap"
          >
            {recLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" aria-hidden="true" />
                Buscando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Descubrí qué hacer hoy
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {recError && (
          <p className="text-xs text-red-300 mt-2 text-center" role="alert">
            Error al buscar recomendaciones. Intentá de nuevo.
          </p>
        )}

        {/* Result card */}
        {triggered && !recLoading && topRec && (() => {
          const isPlace    = topRec.item_type === 'place'    && topRec.place_detail
          const isActivity = topRec.item_type === 'activity' && topRec.activity_detail
          const isEvent    = topRec.item_type === 'event'    && topRec.event_detail

          const name     = isPlace    ? topRec.place_detail!.name
                         : isActivity ? topRec.activity_detail!.name
                         : isEvent    ? topRec.event_detail!.title
                         : ''
          const category = isPlace    ? topRec.place_detail!.category
                         : isActivity ? topRec.activity_detail!.category
                         : isEvent    ? topRec.event_detail!.category
                         : ''
          const address  = isPlace    ? `${topRec.place_detail!.address}, ${topRec.place_detail!.city}`
                         : isActivity ? topRec.activity_detail!.address
                         : isEvent    ? `${topRec.event_detail!.place_address}, ${topRec.event_detail!.place_city}`
                         : ''
          const image    = isPlace    ? topRec.place_detail!.image_url
                         : isActivity ? topRec.activity_detail!.image_url
                         : isEvent    ? topRec.event_detail!.image_url
                         : ''
          const detailUrl = isPlace    ? `/places/${topRec.place_detail!.id}`
                          : isActivity ? `/activities/${topRec.activity_detail!.id}`
                          : isEvent    ? `/events/${topRec.event_detail!.id}`
                          : null

          return (
            <div className="mt-4 bg-white/10 rounded-xl ring-1 ring-white/20 overflow-hidden">
              {(() => {
                const heroImgSrc = image || getCategoryImageUrl(category)
                return (
                  <img
                    src={heroImgSrc}
                    alt={name}
                    className="w-full h-36 object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = getCategoryImageUrl(category) }}
                  />
                )
              })()}
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white text-base leading-tight">{name}</p>
                    <span className="text-xs text-indigo-300 font-medium capitalize">{category}</span>
                  </div>
                  <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5">
                    {parseFloat(topRec.score).toFixed(1)} ★
                  </span>
                </div>
                {address && (
                  <p className="text-xs text-indigo-200 flex items-start gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {address}
                  </p>
                )}
                {topRec.recommendation_reason && (
                  <p className="text-xs text-indigo-100 bg-white/5 rounded-lg px-3 py-2 leading-relaxed italic">
                    "{topRec.recommendation_reason}"
                  </p>
                )}
                {detailUrl && (
                  <button
                    onClick={() => navigate(detailUrl)}
                    className="mt-1 w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    Ver toda la información <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {triggered && !recLoading && !topRec && !recError && (
          <p className="text-xs text-indigo-300 text-center mt-3">
            No encontramos recomendaciones para esos parámetros. Probá ajustando el presupuesto.
          </p>
        )}

        <p className="text-xs text-indigo-300 text-center mt-3">
          También podés ir al{' '}
          <button onClick={() => navigate('/planner')} className="underline hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded">
            planner completo
          </button>{' '}
          para armar un itinerario
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: '225+', label: 'Lugares', color: 'text-primary-500', delay: 'count-up' },
          { value: '50+',  label: 'Actividades', color: 'text-electric-cyan', delay: 'count-up fade-in-up-1' },
          { value: '4.8★', label: 'Valoración', color: 'text-violet-400', delay: 'count-up fade-in-up-2' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-glass-sm">
            <p className={`text-2xl font-bold ${s.color} ${s.delay}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ¿Qué querés hacer? */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">¿Qué querés hacer hoy?</h2>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITY_SHORTCUTS.map((s) => (
            <button
              key={s.type}
              onClick={() => navigate('/explorar', { state: { activityType: s.type } })}
              className="flex flex-col items-center gap-1 p-2 sm:p-3 bg-white border border-gray-200 rounded-xl shadow-glass-sm hover:border-primary-500/40 hover:shadow-neon-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 touch-manipulation active:scale-[0.97]"
            >
              <span className="text-lg sm:text-xl" aria-hidden="true">{s.emoji}</span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 truncate w-full text-center leading-tight">{s.label}</span>
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
            {recentPlans.map((plan) => {
              const planDate = new Date(plan.date + 'T12:00:00')
              return (
              <button
                key={plan.id}
                onClick={() => navigate(`/planes/${plan.id}`)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-glass-sm hover:shadow-neon-sm hover:border-primary-500/30 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 group"
              >
                <div className="flex-shrink-0 w-10 text-center bg-primary-500/10 rounded-lg py-1">
                  <p className="text-base font-bold text-primary-600 leading-none">
                    {planDate.getDate()}
                  </p>
                  <p className="text-[9px] font-medium text-primary-500 uppercase">
                    {planDate.toLocaleDateString('es-AR', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">{plan.title}</p>
                  <p className="text-xs text-gray-500">
                    {plan.city} · {planDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
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
              )
            })}
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
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Más opciones</h2>
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
