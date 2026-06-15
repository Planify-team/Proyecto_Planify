import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import RecommendationsPage from '../RecommendationsPage'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { Recommendation } from '@/types'

vi.mock('@/hooks/useRecommendations', () => ({
  useRecommendations: vi.fn(),
}))

vi.mock('@/components/ui/FavoriteButton', () => ({
  default: () => <button aria-label="Favorito" />,
}))

const mockGetCurrentPosition = vi.fn()
beforeAll(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: mockGetCurrentPosition },
    configurable: true,
  })
})

function makeRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: '1',
    item_type: 'activity',
    activity: 'act-1',
    event: null,
    place: null,
    score: '85.5',
    recommendation_reason: 'Te puede gustar',
    activity_detail: {
      id: 'act-1',
      name: 'Clase de Yoga',
      category: 'Bienestar',
      activity_type: 'group',
      min_budget: '0',
      indoor: true,
      outdoor: false,
    },
    event_detail: null,
    place_detail: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useRecommendations).mockReturnValue({ data: [], isLoading: false } as any)
  mockGetCurrentPosition.mockImplementation((_success: unknown, error: (err: unknown) => void) => {
    error(new Error('Geolocation denied'))
  })
})

describe('RecommendationsPage', () => {
  it('shows loading state', () => {
    vi.mocked(useRecommendations).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.queryByRole('heading', { name: /para vos/i })).not.toBeInTheDocument()
  })

  it('shows empty state when no recommendations', () => {
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText(/sin recomendaciones todavía/i)).toBeInTheDocument()
  })

  it('renders recommendation cards', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [makeRecommendation()],
      isLoading: false,
    } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText('Clase de Yoga')).toBeInTheDocument()
  })

  it('shows item category', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [makeRecommendation()],
      isLoading: false,
    } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText('Bienestar')).toBeInTheDocument()
  })

  it('shows recommendation score', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [makeRecommendation({ score: '92.3' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText('92')).toBeInTheDocument()
  })

  it('shows recommendation reason', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [makeRecommendation({ recommendation_reason: 'Basado en tus preferencias' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText('Basado en tus preferencias')).toBeInTheDocument()
  })

  it('renders event recommendations with title', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [
        makeRecommendation({
          item_type: 'event',
          activity: null,
          event: 'ev-1',
          activity_detail: null,
          event_detail: { id: 'ev-1', title: 'Festival de Rock', category: 'Música' } as any,
        }),
      ],
      isLoading: false,
    } as any)
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByText('Festival de Rock')).toBeInTheDocument()
  })

  it('shows heading', () => {
    renderWithProviders(<RecommendationsPage />)
    expect(screen.getByRole('heading', { name: /para vos/i })).toBeInTheDocument()
  })
})
