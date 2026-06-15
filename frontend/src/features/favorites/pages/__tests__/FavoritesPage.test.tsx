import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import FavoritesPage from '../FavoritesPage'
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites'
import type { Favorite } from '@/types'

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: vi.fn(),
  useRemoveFavorite: vi.fn(),
  useAddFavorite: vi.fn(),
}))

function makeFavorite(overrides: Partial<Favorite> = {}): Favorite {
  return {
    id: '1',
    event: null,
    place: null,
    activity: null,
    item_name: 'Lugar de prueba',
    item_type: 'place',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useFavorites).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useRemoveFavorite).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
})

describe('FavoritesPage', () => {
  it('shows loading state', () => {
    vi.mocked(useFavorites).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<FavoritesPage />)
    expect(screen.queryByText(/mis favoritos/i)).not.toBeInTheDocument()
  })

  it('shows empty state when no favorites', () => {
    renderWithProviders(<FavoritesPage />)
    expect(screen.getByText(/sin favoritos aún/i)).toBeInTheDocument()
  })

  it('renders favorite items', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [makeFavorite({ item_name: 'Café Central' })],
      isLoading: false,
    } as any)
    renderWithProviders(<FavoritesPage />)
    expect(screen.getByText('Café Central')).toBeInTheDocument()
  })

  it('shows item type label', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [makeFavorite({ item_type: 'event' })],
      isLoading: false,
    } as any)
    renderWithProviders(<FavoritesPage />)
    expect(screen.getByText('Evento')).toBeInTheDocument()
  })

  it('renders delete button for each favorite', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [makeFavorite(), makeFavorite({ id: '2', item_name: 'Teatro' })],
      isLoading: false,
    } as any)
    renderWithProviders(<FavoritesPage />)
    expect(screen.getAllByRole('button', { name: /eliminar favorito/i })).toHaveLength(2)
  })

  it('calls removeFavorite with correct id on delete click', () => {
    const mockMutate = vi.fn()
    vi.mocked(useRemoveFavorite).mockReturnValue({ mutate: mockMutate, isPending: false } as any)
    vi.mocked(useFavorites).mockReturnValue({
      data: [makeFavorite({ id: 'fav-42' })],
      isLoading: false,
    } as any)
    renderWithProviders(<FavoritesPage />)
    fireEvent.click(screen.getByRole('button', { name: /eliminar favorito/i }))
    expect(mockMutate).toHaveBeenCalledWith('fav-42')
  })

  it('shows page heading', () => {
    renderWithProviders(<FavoritesPage />)
    expect(screen.getByRole('heading', { name: /mis favoritos/i })).toBeInTheDocument()
  })
})
