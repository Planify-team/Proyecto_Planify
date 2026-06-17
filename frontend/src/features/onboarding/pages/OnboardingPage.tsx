import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles, Check } from 'lucide-react'
import { useSetPreferences } from '@/hooks/usePreferences'
import Button from '@/components/ui/Button'

const PREFERENCE_OPTIONS = [
  { category: 'entertainment', value: 'música',      label: 'Música',      emoji: '🎵' },
  { category: 'entertainment', value: 'cine',         label: 'Cine',        emoji: '🎬' },
  { category: 'entertainment', value: 'gaming',       label: 'Gaming',      emoji: '🎮' },
  { category: 'food',          value: 'gastronomía',  label: 'Gastronomía', emoji: '🍽️' },
  { category: 'sports',        value: 'deportes',     label: 'Deportes',    emoji: '⚽' },
  { category: 'outdoor',       value: 'outdoor',      label: 'Outdoor',     emoji: '🏕️' },
  { category: 'culture',       value: 'arte',         label: 'Arte',        emoji: '🎨' },
  { category: 'culture',       value: 'turismo',      label: 'Turismo',     emoji: '✈️' },
  { category: 'technology',    value: 'tecnología',   label: 'Tecnología',  emoji: '💻' },
  { category: 'lifestyle',     value: 'bienestar',    label: 'Bienestar',   emoji: '🧘' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setPreferences = useSetPreferences()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  const handleSubmit = async () => {
    const prefs = PREFERENCE_OPTIONS
      .filter((o) => selected.has(o.value))
      .map((o) => ({ category: o.category, value: o.value, weight: 3 }))

    if (prefs.length > 0) {
      await setPreferences.mutateAsync(prefs)
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
    navigate('/recomendaciones')
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-7 w-7 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¿Qué te gusta hacer?</h1>
        <p className="text-gray-500">
          Elegí tus intereses para que Planify te sugiera planes personalizados.
          Podés cambiarlos cuando quieras desde tu perfil.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PREFERENCE_OPTIONS.map((opt) => {
          const isSelected = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 bg-primary-500 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/recomendaciones')}
        >
          Omitir por ahora
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={setPreferences.isPending}
          disabled={selected.size === 0}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Ver mis recomendaciones ({selected.size} seleccionados)
        </Button>
      </div>
    </div>
  )
}
