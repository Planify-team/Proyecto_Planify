import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePreferences, useSetPreferences, useRemovePreference } from '@/hooks/usePreferences'
import { useUserActivityStats } from '@/hooks/useDashboard'
import { ActivityStatsCard } from '@/features/dashboard/components/ActivityStatsCard'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const PREFERENCE_OPTIONS = [
  { category: 'entertainment', value: 'música',     emoji: '🎵', label: 'Música' },
  { category: 'entertainment', value: 'cine',        emoji: '🎬', label: 'Cine' },
  { category: 'entertainment', value: 'gaming',      emoji: '🎮', label: 'Gaming' },
  { category: 'food',          value: 'gastronomía', emoji: '🍽️', label: 'Gastronomía' },
  { category: 'sports',        value: 'deportes',    emoji: '⚽', label: 'Deportes' },
  { category: 'outdoor',       value: 'outdoor',     emoji: '🏕️', label: 'Outdoor' },
  { category: 'culture',       value: 'arte',        emoji: '🎨', label: 'Arte' },
  { category: 'culture',       value: 'turismo',     emoji: '✈️', label: 'Turismo' },
  { category: 'technology',    value: 'tecnología',  emoji: '💻', label: 'Tecnología' },
  { category: 'lifestyle',     value: 'bienestar',   emoji: '🧘', label: 'Bienestar' },
]

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { data: preferences = [] } = usePreferences()
  const { data: activityStats } = useUserActivityStats()
  const setPrefs = useSetPreferences()
  const removePref = useRemovePreference()
  const [adding, setAdding] = useState(false)

  if (!user) return null

  const existingValues = new Set(preferences.map((p) => p.value))

  const handleAdd = (value: string, category: string) => {
    const newPref = { category, value, weight: 3 }
    const all = [...preferences.map((p) => ({ category: p.category, value: p.value, weight: p.weight })), newPref]
    setPrefs.mutate(all)
    setAdding(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>

      {/* Datos personales */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user.full_name} src={user.profile_image || undefined} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <Badge variant="info" className="mt-1">{user.role}</Badge>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 font-medium">Nombre</dt>
            <dd className="text-gray-800 mt-0.5">{user.first_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Apellido</dt>
            <dd className="text-gray-800 mt-0.5">{user.last_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Correo electrónico</dt>
            <dd className="text-gray-800 mt-0.5">{user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Miembro desde</dt>
            <dd className="text-gray-800 mt-0.5">{new Date(user.created_at).toLocaleDateString('es-AR')}</dd>
          </div>
        </dl>
      </Card>

      {/* Actividad */}
      {activityStats && <ActivityStatsCard stats={activityStats} />}

      {/* Preferencias */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Mis preferencias</h3>
            <p className="text-xs text-gray-500 mt-0.5">Usamos esto para personalizar tus recomendaciones.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAdding(!adding)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Agregar
          </Button>
        </div>

        {/* Selector */}
        {adding && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium">Elegí qué te interesa:</p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.filter((o) => !existingValues.has(o.value)).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAdd(opt.value, opt.category)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-primary-300 text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
              {PREFERENCE_OPTIONS.every((o) => existingValues.has(o.value)) && (
                <p className="text-sm text-gray-500">Ya agregaste todas las preferencias disponibles.</p>
              )}
            </div>
          </div>
        )}

        {/* Lista de preferencias actuales */}
        {preferences.length === 0 ? (
          <p className="text-sm text-gray-500">No tenés preferencias configuradas. Agregá algunas para recibir mejores recomendaciones.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                <span className="capitalize">{pref.value}</span>
                <button
                  onClick={() => removePref.mutate(pref.id)}
                  disabled={removePref.isPending}
                  className="hover:text-red-500 transition-colors"
                  aria-label={`Quitar ${pref.value}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
