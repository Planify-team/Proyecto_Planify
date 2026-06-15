import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BusinessDashboardPage from '../BusinessDashboardPage'

vi.mock('@/hooks/useDashboard', () => ({
  useBusinessStats: () => ({
    data: { total_places: 3, active_promotions: 1, total_promotions: 2, total_reviews: 10, avg_rating: 4.2 },
    isLoading: false,
  }),
  useOwnedPlaces: () => ({
    data: [
      { id: 'p1', name: 'Café Central', city: 'BA', category: 'cafe', avg_rating: 4.5 },
    ],
    isLoading: false,
  }),
  useOwnedPromotions: () => ({
    data: [
      { id: 'pr1', title: 'Promo verano', place_name: 'Café Central', status: 'active', is_currently_active: true },
    ],
    isLoading: false,
  }),
}))

describe('BusinessDashboardPage', () => {
  it('renders stats cards', () => {
    render(<BusinessDashboardPage />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4.2')).toBeInTheDocument()
  })

  it('renders owned places list', () => {
    render(<BusinessDashboardPage />)
    const matches = screen.getAllByText('Café Central')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders promotions list', () => {
    render(<BusinessDashboardPage />)
    expect(screen.getByText('Promo verano')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })
})
