import { useState } from 'react'
import { Plus, X, User, Pencil, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { usePreferences, useSetPreferences, useRemovePreference } from '@/hooks/usePreferences'
import { useUserActivityStats } from '@/hooks/useDashboard'
import { useUpdateProfile } from '@/hooks/useAuth'
import { ActivityStatsCard } from '@/features/dashboard/components/ActivityStatsCard'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { PREFERENCE_OPTIONS } from '@/lib/preferences'

const ROLE_LABELS: Record<string, string> = {
  user:            'Usuario',
  admin:           'Administrador',
  moderator:       'Moderador',
  business_owner:  'Dueño de negocio',
  event_organizer: 'Organizador de eventos',
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: preferences = [] } = usePreferences()
  const { data: activityStats } = useUserActivityStats()
  const setPrefs = useSetPreferences()
  const removePref = useRemovePreference()
  const updateProfile = useUpdateProfile()
  const [adding, setAdding] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameForm, setNameForm] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '' })

  if (!user) return null

  const existingValues = new Set(preferences.map((p) => p.value))

  const handleAdd = (value: string, category: string) => {
    const newPref = { category, value, weight: 3 }
    const all = [...preferences.map((p) => ({ category: p.category, value: p.value, weight: p.weight })), newPref]
    setPrefs.mutate(all, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
    })
    setAdding(false)
  }

  const handleRemove = (id: string) => {
    removePref.mutate(id, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
    })
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <title>Mi perfil | Planify</title>
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      </div>

      {/* Datos personales */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user.full_name} src={user.profile_image || undefined} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-400 mt-1">{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Información personal</h3>
          {!editingName && (
            <button
              onClick={() => { setNameForm({ first_name: user.first_name, last_name: user.last_name }); setEditingName(true) }}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500/40 rounded"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Editar
            </button>
          )}
        </div>

        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateProfile.mutate(nameForm, {
                onSuccess: () => { setEditingName(false); toast.success('Perfil actualizado') },
                onError: () => toast.error('No se pudo actualizar el perfil'),
              })
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-first-name" className="text-xs text-gray-500 font-medium block mb-1">Nombre</label>
                <input
                  id="profile-first-name"
                  value={nameForm.first_name}
                  onChange={(e) => setNameForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-last-name" className="text-xs text-gray-500 font-medium block mb-1">Apellido</label>
                <input
                  id="profile-last-name"
                  value={nameForm.last_name}
                  onChange={(e) => setNameForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={updateProfile.isPending} leftIcon={<Check className="h-3.5 w-3.5" />}>
                Guardar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
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
        )}
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
          <Button size="sm" variant="secondary" onClick={() => setAdding(!adding)} leftIcon={<Plus className="h-3.5 w-3.5" />} aria-expanded={adding}>
            Agregar
          </Button>
        </div>

        {/* Selector */}
        {adding && (
          <div className="mb-4 p-3 bg-gray-300/5 rounded-xl border border-gray-200/30">
            <p className="text-xs text-gray-500 mb-2 font-medium">Elegí qué te interesa:</p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.filter((o) => !existingValues.has(o.value)).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAdd(opt.value, opt.category)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-primary-400/40 text-primary-600 hover:bg-primary-500/10 transition-colors"
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
            {preferences.map((pref) => {
              const opt = PREFERENCE_OPTIONS.find((o) => o.value === pref.value)
              return (
              <div
                key={pref.id}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/15 text-primary-600 rounded-full text-sm font-medium"
              >
                {opt?.emoji && <span aria-hidden="true">{opt.emoji}</span>}
                <span>{opt?.label ?? pref.value}</span>
                <button
                  onClick={() => handleRemove(pref.id)}
                  disabled={removePref.isPending}
                  className="hover:text-red-500 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40 rounded"
                  aria-label={`Quitar ${opt?.label ?? pref.value}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
