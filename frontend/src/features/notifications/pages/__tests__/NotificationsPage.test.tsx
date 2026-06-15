import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import NotificationsPage from '../NotificationsPage'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import type { Notification } from '@/types'

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useUnreadCount: vi.fn(() => 0),
  useMarkNotificationRead: vi.fn(),
}))

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: '1',
    title: 'Notificación test',
    message: 'Mensaje de prueba',
    notification_type: 'system',
    status: 'unread',
    read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useNotifications).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useMarkNotificationRead).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
})

describe('NotificationsPage', () => {
  it('shows loading state', () => {
    vi.mocked(useNotifications).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.queryByText(/notificaciones/i)).not.toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByText(/sin notificaciones/i)).toBeInTheDocument()
  })

  it('renders unread notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ title: 'Nueva notif', read: false })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByText('Nueva notif')).toBeInTheDocument()
  })

  it('shows Sin leer section for unread notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ read: false })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByText(/sin leer/i)).toBeInTheDocument()
  })

  it('shows Leídas section for read notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ read: true })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByText(/leídas/i)).toBeInTheDocument()
  })

  it('shows mark-as-read button for unread notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ read: false })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByRole('button', { name: /marcar como leída/i })).toBeInTheDocument()
  })

  it('calls markRead when mark-as-read button is clicked', () => {
    const mockMutate = vi.fn()
    vi.mocked(useMarkNotificationRead).mockReturnValue({ mutate: mockMutate, isPending: false } as any)
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ id: 'notif-1', read: false })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como leída/i }))
    expect(mockMutate).toHaveBeenCalledWith('notif-1')
  })

  it('does not show mark-as-read button for read notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ read: true })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.queryByRole('button', { name: /marcar como leída/i })).not.toBeInTheDocument()
  })

  it('shows unread count badge in heading', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: [makeNotification({ read: false }), makeNotification({ id: '2', read: false })],
      isLoading: false,
    } as any)
    renderWithProviders(<NotificationsPage />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
