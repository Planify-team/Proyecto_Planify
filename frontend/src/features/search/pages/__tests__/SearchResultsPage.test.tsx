import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SearchResultsPage from '../SearchResultsPage'
import * as useSearchModule from '@/hooks/useSearch'

vi.mock('@/hooks/useSearch')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/search?q=café']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SearchResultsPage', () => {
  afterEach(() => vi.clearAllMocks())

  it('shows loading state', () => {
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useSearchModule.useSearch>)

    render(<SearchResultsPage />, { wrapper })
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('shows results when data arrives', async () => {
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      data: {
        places: [{ id: '1', name: 'Café Tortoni', category: 'cafe', city: 'Buenos Aires', image_url: '', price_level: 2 }],
        activities: [],
        events: [],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useSearchModule.useSearch>)

    render(<SearchResultsPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Café Tortoni')).toBeInTheDocument())
    expect(screen.getByText('Lugares')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      data: { places: [], activities: [], events: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useSearchModule.useSearch>)

    render(<SearchResultsPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/sin resultados/i)).toBeInTheDocument())
  })

  it('shows event results', async () => {
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      data: {
        places: [],
        activities: [],
        events: [{ id: '2', title: 'Festival BA', category: 'festival', start_date: '2026-07-01T18:00:00Z', price: '0', image_url: '' }],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useSearchModule.useSearch>)

    render(<SearchResultsPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Festival BA')).toBeInTheDocument())
    expect(screen.getByText('Eventos')).toBeInTheDocument()
  })
})
