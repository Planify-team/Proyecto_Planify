import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import MapPage from '../MapPage'
import { usePlaces } from '@/hooks/usePlaces'
import type { Place } from '@/types'

vi.mock('@/hooks/usePlaces', () => ({
  usePlaces: vi.fn(),
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: vi.fn() }),
}))

vi.mock('leaflet', () => {
  class MockIcon {
    constructor(_opts: unknown) {}
    static Default = {
      prototype: { _getIconUrl: vi.fn() },
      mergeOptions: vi.fn(),
    }
  }
  return {
    default: { Icon: MockIcon },
    Icon: MockIcon,
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))

const mockGetCurrentPosition = vi.fn()
beforeAll(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: mockGetCurrentPosition },
    configurable: true,
  })
})

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: '1',
    name: 'Parque Centenario',
    description: '',
    category: 'Parque',
    city: 'Buenos Aires',
    address: 'Av. Díaz Vélez',
    phone: '',
    website: '',
    image_url: '',
    price_level: 0,
    latitude: -34.6037,
    longitude: -58.3816,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(usePlaces).mockReturnValue({ data: [], isLoading: false } as any)
  mockGetCurrentPosition.mockImplementation((_s: unknown, error: (e: unknown) => void) => {
    error(new Error('denied'))
  })
})

describe('MapPage', () => {
  it('shows loading state', () => {
    vi.mocked(usePlaces).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<MapPage />)
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })

  it('renders map container', () => {
    renderWithProviders(<MapPage />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('shows page heading', () => {
    renderWithProviders(<MapPage />)
    expect(screen.getByRole('heading', { name: /mapa/i })).toBeInTheDocument()
  })

  it('shows place count in subtitle', () => {
    vi.mocked(usePlaces).mockReturnValue({
      data: [makePlace(), makePlace({ id: '2', name: 'Otro lugar' })],
      isLoading: false,
    } as any)
    renderWithProviders(<MapPage />)
    expect(screen.getByText(/2 lugares en el mapa/i)).toBeInTheDocument()
  })

  it('renders place list cards', () => {
    vi.mocked(usePlaces).mockReturnValue({
      data: [makePlace({ name: 'Parque Centenario' })],
      isLoading: false,
    } as any)
    renderWithProviders(<MapPage />)
    expect(screen.getAllByText('Parque Centenario').length).toBeGreaterThan(0)
  })

  it('shows Mi ubicación button', () => {
    renderWithProviders(<MapPage />)
    expect(screen.getByRole('button', { name: /mi ubicación/i })).toBeInTheDocument()
  })

  it('shows places city and category in list', () => {
    vi.mocked(usePlaces).mockReturnValue({
      data: [makePlace({ city: 'Buenos Aires', category: 'Parque' })],
      isLoading: false,
    } as any)
    renderWithProviders(<MapPage />)
    expect(screen.getByText(/buenos aires/i)).toBeInTheDocument()
  })

  it('renders markers for places with coordinates', () => {
    vi.mocked(usePlaces).mockReturnValue({
      data: [
        makePlace({ id: '1', latitude: -34.60, longitude: -58.38 }),
        makePlace({ id: '2', latitude: -34.61, longitude: -58.39 }),
      ],
      isLoading: false,
    } as any)
    renderWithProviders(<MapPage />)
    expect(screen.getAllByTestId('map-marker').length).toBeGreaterThan(0)
  })
})
