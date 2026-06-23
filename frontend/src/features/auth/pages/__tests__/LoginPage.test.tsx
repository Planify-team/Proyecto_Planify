import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import LoginPage from '../LoginPage'
import { useLogin } from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useLogin: vi.fn(),
  useRegister: vi.fn(),
  useLogout: vi.fn(),
}))

function makeMutationResult(overrides = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useLogin>
}

beforeEach(() => {
  vi.mocked(useLogin).mockReturnValue(makeMutationResult())
})

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('shows validation error for empty email on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => {
      expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument()
    })
  })

  it('calls login mutate with form data on valid submit', async () => {
    const mockMutate = vi.fn()
    vi.mocked(useLogin).mockReturnValue(makeMutationResult({ mutate: mockMutate }))
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('shows error message when login fails', () => {
    vi.mocked(useLogin).mockReturnValue(
      makeMutationResult({
        isError: true,
        error: { response: { data: { success: false, error: { message: 'Credenciales inválidas' } } } } as any,
      }),
    )
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
  })

  it('disables submit button while loading', () => {
    vi.mocked(useLogin).mockReturnValue(makeMutationResult({ isPending: true }))
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeDisabled()
  })

  it('renders link to register page', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('link', { name: /registrate/i })).toBeInTheDocument()
  })
})
