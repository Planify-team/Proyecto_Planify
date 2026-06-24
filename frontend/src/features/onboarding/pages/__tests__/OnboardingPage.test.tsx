import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import OnboardingPage from '../OnboardingPage'
import { useSetPreferences } from '@/hooks/usePreferences'

vi.mock('@/hooks/usePreferences', () => ({
  useSetPreferences: vi.fn(),
  usePreferences: vi.fn(() => ({ data: [], isLoading: false })),
}))

beforeEach(() => {
  vi.mocked(useSetPreferences).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any)
})

describe('OnboardingPage', () => {
  it('renders all preference options', () => {
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByText('Música')).toBeInTheDocument()
    expect(screen.getByText('Cine')).toBeInTheDocument()
    expect(screen.getByText('Deportes')).toBeInTheDocument()
    expect(screen.getByText('Arte')).toBeInTheDocument()
    expect(screen.getByText('Tecnología')).toBeInTheDocument()
  })

  it('submit button is disabled when nothing is selected', () => {
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByRole('button', { name: /ver mis recomendaciones/i })).toBeDisabled()
  })

  it('enables submit button after selecting a preference', () => {
    renderWithProviders(<OnboardingPage />)
    fireEvent.click(screen.getByText('Música'))
    expect(screen.getByRole('button', { name: /ver mis recomendaciones/i })).not.toBeDisabled()
  })

  it('shows selected count in submit button', () => {
    renderWithProviders(<OnboardingPage />)
    fireEvent.click(screen.getByText('Música'))
    fireEvent.click(screen.getByText('Cine'))
    expect(screen.getByRole('button', { name: /ver mis recomendaciones \(2\)/i })).toBeInTheDocument()
  })

  it('toggles deselection when clicking a selected preference', () => {
    renderWithProviders(<OnboardingPage />)
    fireEvent.click(screen.getByText('Música'))
    fireEvent.click(screen.getByText('Música'))
    expect(screen.getByRole('button', { name: /ver mis recomendaciones/i })).toBeDisabled()
  })

  it('shows Omitir button', () => {
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByRole('button', { name: /omitir/i })).toBeInTheDocument()
  })

  it('calls setPreferences with selected values on submit', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useSetPreferences).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
    renderWithProviders(<OnboardingPage />)
    fireEvent.click(screen.getByText('Música'))
    fireEvent.click(screen.getByRole('button', { name: /ver mis recomendaciones/i }))
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ value: 'música', category: 'entertainment' }),
        ]),
      )
    })
  })

  it('does not call setPreferences when omitting', () => {
    const mockMutateAsync = vi.fn()
    vi.mocked(useSetPreferences).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
    renderWithProviders(<OnboardingPage />)
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows heading', () => {
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByRole('heading', { name: /qué te gusta hacer/i })).toBeInTheDocument()
  })
})
