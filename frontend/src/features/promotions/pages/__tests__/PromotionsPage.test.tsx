import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import PromotionsPage from '../PromotionsPage'
import { usePromotions } from '@/hooks/usePromotions'
import type { Promotion } from '@/types'

vi.mock('@/hooks/usePromotions', () => ({
  usePromotions: vi.fn(),
}))

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: '1',
    place: 'place-1',
    place_name: 'Café Central',
    title: 'Promo Café',
    description: '30% de descuento en cafés',
    discount_percentage: '30',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    status: 'active',
    is_currently_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(usePromotions).mockReturnValue({ data: [], isLoading: false } as any)
})

describe('PromotionsPage', () => {
  it('shows loading state', () => {
    vi.mocked(usePromotions).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.queryByRole('heading', { name: /promociones/i })).not.toBeInTheDocument()
  })

  it('shows empty state when no promotions', () => {
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText(/sin promociones activas/i)).toBeInTheDocument()
  })

  it('renders promotion cards', () => {
    vi.mocked(usePromotions).mockReturnValue({
      data: [makePromotion({ title: 'Promo especial' })],
      isLoading: false,
    } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText('Promo especial')).toBeInTheDocument()
  })

  it('shows discount percentage', () => {
    vi.mocked(usePromotions).mockReturnValue({
      data: [makePromotion({ discount_percentage: '25' })],
      isLoading: false,
    } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText(/25% OFF/i)).toBeInTheDocument()
  })

  it('shows place name when available', () => {
    vi.mocked(usePromotions).mockReturnValue({
      data: [makePromotion({ place_name: 'Restaurante El Buen Gusto' })],
      isLoading: false,
    } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText('Restaurante El Buen Gusto')).toBeInTheDocument()
  })

  it('renders multiple promotions', () => {
    vi.mocked(usePromotions).mockReturnValue({
      data: [
        makePromotion({ id: '1', title: 'Promo A' }),
        makePromotion({ id: '2', title: 'Promo B' }),
        makePromotion({ id: '3', title: 'Promo C' }),
      ],
      isLoading: false,
    } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText('Promo A')).toBeInTheDocument()
    expect(screen.getByText('Promo B')).toBeInTheDocument()
    expect(screen.getByText('Promo C')).toBeInTheDocument()
  })

  it('shows promotion description', () => {
    vi.mocked(usePromotions).mockReturnValue({
      data: [makePromotion({ description: 'Válido solo los fines de semana' })],
      isLoading: false,
    } as any)
    renderWithProviders(<PromotionsPage />)
    expect(screen.getByText('Válido solo los fines de semana')).toBeInTheDocument()
  })
})
