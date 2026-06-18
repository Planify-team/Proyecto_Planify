import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { ItineraryView } from '../../components/ItineraryView'
import type { Plan } from '@/types'

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  title: 'Plan para 01/07/2026',
  date: '2026-07-01',
  budget: '5000',
  people_count: 2,
  city: 'Buenos Aires',
  slug: 'plan-2026-07-01-abc',
  is_public: false,
  status: 'generated',
  items: [
    {
      id: 'item-1',
      entity_type: 'activity',
      entity_id: 'ent-1',
      entity_name: 'Visita al MALBA',
      entity_description: 'Museo de arte.',
      entity_category: 'Museo',
      slot: 'morning',
      order: 0,
      note: '',
      generation_reason: 'Coincide con tus preferencias.',
      created_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'item-2',
      entity_type: 'place',
      entity_id: 'ent-2',
      entity_name: 'Café El Popular',
      entity_description: 'Café en Palermo.',
      entity_category: 'Café',
      slot: 'afternoon',
      order: 0,
      note: 'Almuerzo aquí',
      generation_reason: 'Popular en la zona.',
      created_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'item-3',
      entity_type: 'event',
      entity_id: 'ent-3',
      entity_name: 'Show de tango',
      entity_description: 'Show en San Telmo.',
      entity_category: 'Entretenimiento',
      slot: 'evening',
      order: 0,
      note: '',
      generation_reason: 'Evento en tu ciudad.',
      created_at: '2026-07-01T10:00:00Z',
    },
  ],
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
  ...overrides,
})

describe('ItineraryView', () => {
  it('shows the three slot headings', () => {
    renderWithProviders(<ItineraryView plan={makePlan()} />)
    expect(screen.getAllByText('Mañana').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Tarde').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Noche').length).toBeGreaterThanOrEqual(1)
  })

  it('shows generation reason for each item', () => {
    renderWithProviders(<ItineraryView plan={makePlan()} />)
    expect(screen.getByText('Coincide con tus preferencias.')).toBeInTheDocument()
    expect(screen.getByText('Popular en la zona.')).toBeInTheDocument()
    expect(screen.getByText('Evento en tu ciudad.')).toBeInTheDocument()
  })

  it('shows remove button when onRemoveItem is provided and not readonly', () => {
    const onRemove = vi.fn()
    renderWithProviders(<ItineraryView plan={makePlan()} onRemoveItem={onRemove} />)
    const buttons = screen.getAllByRole('button', { name: /^Quitar:/i })
    expect(buttons).toHaveLength(3)
  })

  it('calls onRemoveItem when remove button is clicked', () => {
    const onRemove = vi.fn()
    renderWithProviders(<ItineraryView plan={makePlan()} onRemoveItem={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar: Visita al MALBA' }))
    expect(onRemove).toHaveBeenCalledWith('item-1')
  })

  it('does not show remove buttons in readonly mode', () => {
    renderWithProviders(<ItineraryView plan={makePlan()} readonly />)
    expect(screen.queryByRole('button', { name: /^Quitar:/i })).not.toBeInTheDocument()
  })

  it('shows empty slot message when a slot has no items', () => {
    const plan = makePlan({ items: [] })
    renderWithProviders(<ItineraryView plan={plan} />)
    const emptyMessages = screen.getAllByText(/Sin actividades para este horario/i)
    expect(emptyMessages).toHaveLength(3)
  })
})
