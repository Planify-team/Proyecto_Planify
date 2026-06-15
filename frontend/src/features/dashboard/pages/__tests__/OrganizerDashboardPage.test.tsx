import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OrganizerDashboardPage from '../OrganizerDashboardPage'

vi.mock('@/hooks/useDashboard', () => ({
  useOrganizerStats: () => ({
    data: { total_events: 5, published_events: 3, total_reviews: 20, avg_rating: 4.7 },
    isLoading: false,
  }),
  useOwnedEvents: () => ({
    data: [
      {
        id: 'e1',
        title: 'Festival Jazz',
        start_date: '2026-07-15T20:00:00Z',
        category: 'music',
        status: 'published',
        avg_rating: 4.8,
      },
    ],
    isLoading: false,
  }),
}))

describe('OrganizerDashboardPage', () => {
  it('renders stats cards', () => {
    render(<OrganizerDashboardPage />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders event list', () => {
    render(<OrganizerDashboardPage />)
    expect(screen.getByText('Festival Jazz')).toBeInTheDocument()
    expect(screen.getByText('Publicado')).toBeInTheDocument()
  })

  it('shows avg_rating for events', () => {
    render(<OrganizerDashboardPage />)
    expect(screen.getByText('★ 4.8')).toBeInTheDocument()
  })
})
