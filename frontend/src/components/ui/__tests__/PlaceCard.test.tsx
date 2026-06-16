import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import PlaceCard from '../PlaceCard'
import type { Place } from '@/types'

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ data: [] }),
  useAddFavorite: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFavorite: () => ({ mutate: vi.fn(), isPending: false }),
}))

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: '1',
    name: 'Test Place',
    description: 'Una descripción de prueba',
    category: 'Bar',
    city: 'Buenos Aires',
    address: 'Test St 1',
    phone: '',
    website: '',
    image_url: '',
    price_level: 0,
    source: 'osm',
    is_active: true,
    avg_rating: null,
    review_count: 0,
    opening_hours: '',
    cuisine: '',
    fee: null,
    outdoor_seating: null,
    wheelchair: '',
    internet_access: null,
    is_open_now: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('PlaceCard', () => {
  it('renders the place name', () => {
    renderWithProviders(<PlaceCard place={makePlace()} />)
    expect(screen.getByText('Test Place')).toBeInTheDocument()
  })

  it('shows "Abierto ahora" badge when is_open_now=true', () => {
    renderWithProviders(<PlaceCard place={makePlace({ is_open_now: true })} />)
    expect(screen.getByText('Abierto ahora')).toBeInTheDocument()
  })

  it('shows "Cerrado" badge when is_open_now=false', () => {
    renderWithProviders(<PlaceCard place={makePlace({ is_open_now: false })} />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('does not show status badge when is_open_now=null', () => {
    renderWithProviders(<PlaceCard place={makePlace({ is_open_now: null })} />)
    expect(screen.queryByText('Abierto ahora')).not.toBeInTheDocument()
    expect(screen.queryByText('Cerrado')).not.toBeInTheDocument()
  })

  it('shows "Con terraza" when outdoor_seating=true', () => {
    renderWithProviders(<PlaceCard place={makePlace({ outdoor_seating: true })} />)
    expect(screen.getByText('Con terraza')).toBeInTheDocument()
  })

  it('does not show terraza badge when outdoor_seating=false', () => {
    renderWithProviders(<PlaceCard place={makePlace({ outdoor_seating: false })} />)
    expect(screen.queryByText('Con terraza')).not.toBeInTheDocument()
  })

  it('shows "Entrada libre" when fee=false', () => {
    renderWithProviders(<PlaceCard place={makePlace({ fee: false })} />)
    expect(screen.getByText('Entrada libre')).toBeInTheDocument()
  })

  it('does not show entrada libre when fee=true', () => {
    renderWithProviders(<PlaceCard place={makePlace({ fee: true })} />)
    expect(screen.queryByText('Entrada libre')).not.toBeInTheDocument()
  })

  it('shows Wifi badge when internet_access=true', () => {
    renderWithProviders(<PlaceCard place={makePlace({ internet_access: true })} />)
    expect(screen.getByText('Wifi')).toBeInTheDocument()
  })

  it('shows cuisine when present', () => {
    renderWithProviders(<PlaceCard place={makePlace({ cuisine: 'pizza' })} />)
    expect(screen.getByText('pizza')).toBeInTheDocument()
  })
})
