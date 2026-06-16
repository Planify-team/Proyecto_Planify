import { render, screen } from '@testing-library/react'
import WeatherForecastWidget from '../WeatherForecastWidget'
import type { ForecastDay } from '@/types'

function makeDay(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date: '2026-06-17',
    day_name: 'Miércoles',
    condition: 'Clear',
    description: 'cielo despejado',
    temp_min: 10.0,
    temp_max: 22.0,
    precipitation_mm: 0.0,
    is_outdoor_friendly: true,
    ...overrides,
  }
}

describe('WeatherForecastWidget', () => {
  it('renders 5 forecast cards', () => {
    const forecast = Array.from({ length: 5 }, (_, i) =>
      makeDay({ date: `2026-06-${17 + i}`, day_name: ['Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i] })
    )
    render(<WeatherForecastWidget forecast={forecast} isLoading={false} />)
    expect(screen.getAllByText(/°/).length).toBeGreaterThanOrEqual(5)
  })

  it('shows "Ideal" badge when is_outdoor_friendly=true', () => {
    render(<WeatherForecastWidget forecast={[makeDay({ is_outdoor_friendly: true })]} isLoading={false} />)
    expect(screen.getByText('Ideal')).toBeInTheDocument()
  })

  it('shows "Adentro" badge when is_outdoor_friendly=false', () => {
    render(
      <WeatherForecastWidget forecast={[makeDay({ is_outdoor_friendly: false })]} isLoading={false} />
    )
    expect(screen.getByText('Adentro')).toBeInTheDocument()
  })

  it('shows skeleton when isLoading=true', () => {
    const { container } = render(<WeatherForecastWidget forecast={undefined} isLoading={true} />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders nothing when forecast is empty and not loading', () => {
    const { container } = render(<WeatherForecastWidget forecast={[]} isLoading={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('highlights the selected date card', () => {
    const forecast = [makeDay({ date: '2026-06-17' }), makeDay({ date: '2026-06-18', day_name: 'Jueves' })]
    const { container } = render(
      <WeatherForecastWidget forecast={forecast} isLoading={false} highlightDate="2026-06-17" />
    )
    const highlighted = container.querySelector('.bg-indigo-50')
    expect(highlighted).toBeInTheDocument()
  })
})
