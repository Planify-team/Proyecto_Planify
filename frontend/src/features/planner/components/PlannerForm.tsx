import { useState } from 'react'
import { Calendar, DollarSign, Users, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { PlanGenerateInput } from '@/types'

interface Props {
  onSubmit: (input: PlanGenerateInput) => void
  isLoading: boolean
}

export function PlannerForm({ onSubmit, isLoading }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState('')
  const [budget, setBudget] = useState('')
  const [peopleCount, setPeopleCount] = useState('2')
  const [city, setCity] = useState('')

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
        <label htmlFor="plan-date" className="block text-sm font-medium text-gray-700 mb-1">
          <Calendar className="inline h-4 w-4 mr-1" />
          Fecha del plan
        </label>
        <input
          id="plan-date"
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <div>
        <label htmlFor="plan-city" className="block text-sm font-medium text-gray-700 mb-1">
          <MapPin className="inline h-4 w-4 mr-1" />
          Ciudad
        </label>
        <input
          id="plan-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Buenos Aires"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <div>
        <label htmlFor="plan-budget" className="block text-sm font-medium text-gray-700 mb-1">
          <DollarSign className="inline h-4 w-4 mr-1" />
          Presupuesto total (ARS)
        </label>
        <input
          id="plan-budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="5000"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <div>
        <label htmlFor="plan-people" className="block text-sm font-medium text-gray-700 mb-1">
          <Users className="inline h-4 w-4 mr-1" />
          Cantidad de personas
        </label>
        <input
          id="plan-people"
          type="number"
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
          min="1"
          max="20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
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
