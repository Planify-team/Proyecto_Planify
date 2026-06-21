import { useState } from 'react'
import { Calendar, DollarSign, Users, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { PlanGenerateInput } from '@/types'

const CABA_BARRIOS = [
  'Buenos Aires',
  'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo',
  'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución',
  'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos',
  'Monte Castro', 'Montserrat', 'Nueva Pompeya', 'Núñez', 'Palermo',
  'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios',
  'Paternal', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra',
  'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sársfield', 'Versalles',
  'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre',
  'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón',
  'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza',
]

// Otras ciudades desactivadas hasta tener datos reales para ellas
// const OTHER_CITIES = ['Córdoba', 'Rosario', 'Mendoza', 'Mar del Plata', 'La Plata', 'Tucumán']

interface Props {
  onSubmit: (input: PlanGenerateInput) => void
  isLoading: boolean
}

export function PlannerForm({ onSubmit, isLoading }: Props) {
  const _d = new Date()
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`

  const [date, setDate] = useState(today)
  const [budget, setBudget] = useState('5000')
  const [peopleCount, setPeopleCount] = useState('2')
  const [city, setCity] = useState('Buenos Aires')

  const isValid = date && city && Number(budget) >= 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      date,
      budget: budget || '0',
      people_count: Number(peopleCount) || 1,
      city,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="plan-date" className="block text-sm font-medium text-gray-600 mb-1">
          <Calendar className="inline h-4 w-4 mr-1" aria-hidden="true" />
          Fecha del plan
        </label>
        <input
          id="plan-date"
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50"
        />
      </div>

      <div>
        <label htmlFor="plan-city" className="block text-sm font-medium text-gray-600 mb-1">
          <MapPin className="inline h-4 w-4 mr-1" aria-hidden="true" />
          Ciudad / Barrio
        </label>
        <select
          id="plan-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50"
        >
          {CABA_BARRIOS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="plan-budget" className="block text-sm font-medium text-gray-600 mb-1">
          <DollarSign className="inline h-4 w-4 mr-1" aria-hidden="true" />
          Presupuesto total (ARS)
        </label>
        <input
          id="plan-budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="5000"
          min="0"
          className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50"
        />
        {(budget === '' || budget === '0') && (
          <p className="text-xs text-amber-400 mt-1">
            Con presupuesto en $0 solo se incluirán actividades gratuitas.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="plan-people" className="block text-sm font-medium text-gray-600 mb-1">
          <Users className="inline h-4 w-4 mr-1" aria-hidden="true" />
          Cantidad de personas
        </label>
        <input
          id="plan-people"
          type="number"
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
          min="1"
          max="20"
          className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50"
        />
      </div>

      <Button
        type="submit"
        disabled={!isValid}
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Generando...' : 'Generar itinerario'}
      </Button>
    </form>
  )
}
