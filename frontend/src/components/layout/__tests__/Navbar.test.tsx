import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import Navbar from '../Navbar'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'

vi.mock('@/store/authStore', () => ({ useAuthStore: vi.fn() }))
vi.mock('@/hooks/useAuth', () => ({
  useLogin: vi.fn(),
  useRegister: vi.fn(),
  useLogout: vi.fn(),
}))
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({ data: [], isLoading: false })),
  useUnreadCount: vi.fn(() => 0),
  useMarkNotificationRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

const guestState = { user: null, isAuthenticated: false, accessToken: null, refreshToken: null }
const authUser = {
  id: '1',
  email: 'user@test.com',
  first_name: 'Ana',
  last_name: 'García',
  full_name: 'Ana García',
  role: 'user' as const,
  profile_image: null,
  is_active: true,
  date_joined: '2024-01-01',
}
const authState = { user: authUser, isAuthenticated: true, accessToken: 'tok', refreshToken: 'ref' }

beforeEach(() => {
  vi.mocked(useAuthStore).mockReturnValue(guestState as any)
  vi.mocked(useLogout).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  vi.mocked(useUnreadCount).mockReturnValue(0)
})

describe('Navbar', () => {
  describe('unauthenticated', () => {
    it('shows Ingresar link', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByRole('link', { name: /ingresar/i })).toBeInTheDocument()
    })

    it('shows Registrarse button', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument()
    })

    it('does not show nav links', () => {
      renderWithProviders(<Navbar />)
      expect(screen.queryByRole('link', { name: /explorar/i })).not.toBeInTheDocument()
    })
  })

  describe('authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(authState as any)
    })

    it('shows user first name', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByText('Ana')).toBeInTheDocument()
    })

    it('shows desktop navigation links', () => {
      renderWithProviders(<Navbar />)
      expect(screen.getByRole('link', { name: /explorar/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /favoritos/i })).toBeInTheDocument()
    })

    it('calls logout mutate when Salir is clicked', () => {
      const mockMutate = vi.fn()
      vi.mocked(useLogout).mockReturnValue({ mutate: mockMutate, isPending: false } as any)
      renderWithProviders(<Navbar />)
      fireEvent.click(screen.getByRole('button', { name: /salir/i }))
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    it('shows notification badge when there are unread notifications', () => {
      vi.mocked(useUnreadCount).mockReturnValue(3)
      renderWithProviders(<Navbar />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows 9+ badge when unread count exceeds 9', () => {
      vi.mocked(useUnreadCount).mockReturnValue(12)
      renderWithProviders(<Navbar />)
      expect(screen.getAllByText('9+').length).toBeGreaterThan(0)
    })

    it('does not show badge when no unread notifications', () => {
      vi.mocked(useUnreadCount).mockReturnValue(0)
      renderWithProviders(<Navbar />)
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
    })

  })
})
