import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import RegisterPage from '../RegisterPage'
import { useRegister } from '@/hooks/useAuth'

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
  } as unknown as ReturnType<typeof useRegister>
}

beforeEach(() => {
  vi.mocked(useRegister).mockReturnValue(makeMutationResult())
})

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirm: string
  }> = {},
) {
  const data = {
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan@example.com',
    password: 'password123',
    password_confirm: 'password123',
    ...overrides,
  }
  await user.type(screen.getByLabelText(/nombre/i), data.first_name)
  await user.type(screen.getByLabelText(/apellido/i), data.last_name)
  await user.type(screen.getByLabelText(/correo electrónico/i), data.email)
  await user.type(screen.getByLabelText('Contraseña'), data.password)
  await user.type(screen.getByLabelText('Confirmar contraseña'), data.password_confirm)
}

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
  })

  it('shows validation error for password mismatch', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await fillForm(user, { password_confirm: 'different123' })
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    await waitFor(() => {
      expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await fillForm(user, { password: 'short', password_confirm: 'short' })
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    })
  })

  it('calls register mutate with form data on valid submit', async () => {
    const mockMutate = vi.fn()
    vi.mocked(useRegister).mockReturnValue(makeMutationResult({ mutate: mockMutate }))
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'juan@example.com',
          first_name: 'Juan',
          last_name: 'Pérez',
        }),
      )
    })
  })

  it('shows server error message when registration fails', () => {
    vi.mocked(useRegister).mockReturnValue(
      makeMutationResult({
        isError: true,
        error: { response: { data: { success: false, error: { message: 'El correo ya está registrado' } } } } as any,
      }),
    )
    renderWithProviders(<RegisterPage />)
    expect(screen.getByText(/el correo ya está registrado/i)).toBeInTheDocument()
  })

  it('disables submit button while loading', () => {
    vi.mocked(useRegister).mockReturnValue(makeMutationResult({ isPending: true }))
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeDisabled()
  })

  it('renders link to login page', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('link', { name: /ingresar/i })).toBeInTheDocument()
  })
})
