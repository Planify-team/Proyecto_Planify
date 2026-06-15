import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import RemindersPage from '../RemindersPage'
import { useReminders, useRemoveReminder } from '@/hooks/useReminders'
import type { Reminder } from '@/types'

vi.mock('@/hooks/useReminders', () => ({
  useReminders: vi.fn(),
  useRemoveReminder: vi.fn(),
  useCreateReminder: vi.fn(),
}))

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: '1',
    event: 'event-1',
    event_title: 'Concierto de Jazz',
    reminder_date: new Date('2025-07-15T20:00:00').toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(useReminders).mockReturnValue({ data: [], isLoading: false } as any)
  vi.mocked(useRemoveReminder).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
})

describe('RemindersPage', () => {
  it('shows loading state', () => {
    vi.mocked(useReminders).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderWithProviders(<RemindersPage />)
    expect(screen.queryByText(/mis recordatorios/i)).not.toBeInTheDocument()
  })

  it('shows empty state when no reminders', () => {
    renderWithProviders(<RemindersPage />)
    expect(screen.getByText(/sin recordatorios/i)).toBeInTheDocument()
  })

  it('renders reminders list', () => {
    vi.mocked(useReminders).mockReturnValue({
      data: [makeReminder({ event_title: 'Concierto de Jazz' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RemindersPage />)
    expect(screen.getByText('Concierto de Jazz')).toBeInTheDocument()
  })

  it('shows reminder count badge when there are reminders', () => {
    vi.mocked(useReminders).mockReturnValue({
      data: [makeReminder(), makeReminder({ id: '2', event_title: 'Otro evento' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RemindersPage />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows Eliminar button for each reminder', () => {
    vi.mocked(useReminders).mockReturnValue({
      data: [makeReminder()],
      isLoading: false,
    } as any)
    renderWithProviders(<RemindersPage />)
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })

  it('requires confirmation before deleting', () => {
    const mockMutate = vi.fn()
    vi.mocked(useRemoveReminder).mockReturnValue({ mutate: mockMutate, isPending: false } as any)
    vi.mocked(useReminders).mockReturnValue({
      data: [makeReminder({ id: 'rem-1' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RemindersPage />)

    const deleteBtn = screen.getByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteBtn)
    expect(mockMutate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
  })

  it('calls removeReminder after confirmation', () => {
    const mockMutate = vi.fn()
    vi.mocked(useRemoveReminder).mockReturnValue({ mutate: mockMutate, isPending: false } as any)
    vi.mocked(useReminders).mockReturnValue({
      data: [makeReminder({ id: 'rem-1' })],
      isLoading: false,
    } as any)
    renderWithProviders(<RemindersPage />)

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(mockMutate).toHaveBeenCalledWith('rem-1')
  })

  it('shows page heading', () => {
    renderWithProviders(<RemindersPage />)
    expect(screen.getByRole('heading', { name: /mis recordatorios/i })).toBeInTheDocument()
  })
})
