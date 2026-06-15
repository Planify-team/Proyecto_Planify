import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlanFeedbackModal } from '../../components/PlanFeedbackModal'
import type { PlanItem } from '@/types'

vi.mock('@/services/plannerService', () => ({
  plannerService: {
    submitFeedback: vi.fn().mockResolvedValue({ id: 'fb-1', rating: 4, entity_type: 'place', entity_id: 'p-1', comment: '', created_at: '' }),
  },
}))

const mockItem: PlanItem = {
  id: 'item-1',
  entity_type: 'place',
  entity_id: 'place-id-1',
  slot: 'morning',
  order: 0,
  note: '',
  generation_reason: '',
  created_at: '2026-06-01T00:00:00Z',
}

describe('PlanFeedbackModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    onClose.mockClear()
  })

  it('does not render when closed', () => {
    render(
      <PlanFeedbackModal isOpen={false} onClose={onClose} planId="plan-1" item={mockItem} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(
      <PlanFeedbackModal isOpen={true} onClose={onClose} planId="plan-1" item={mockItem} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('¿Qué te pareció?')).toBeInTheDocument()
  })

  it('submit button is disabled when no star selected', () => {
    render(
      <PlanFeedbackModal isOpen={true} onClose={onClose} planId="plan-1" item={mockItem} />
    )
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled()
  })

  it('shows success state after submission', async () => {
    render(
      <PlanFeedbackModal isOpen={true} onClose={onClose} planId="plan-1" item={mockItem} />
    )
    fireEvent.click(screen.getByLabelText('4 estrellas'))
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(screen.getByText('¡Gracias por tu feedback!')).toBeInTheDocument()
    })
  })
})
