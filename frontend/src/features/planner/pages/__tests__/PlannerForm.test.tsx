import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { PlannerForm } from '../../components/PlannerForm'

describe('PlannerForm', () => {
  it('renders required fields', () => {
    renderWithProviders(<PlannerForm onSubmit={vi.fn()} isLoading={false} />)
    expect(screen.getByLabelText(/Fecha del plan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Presupuesto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cantidad de personas/i)).toBeInTheDocument()
  })

  it('submit button is disabled without date or city', () => {
    renderWithProviders(<PlannerForm onSubmit={vi.fn()} isLoading={false} />)
    const btn = screen.getByRole('button', { name: /Generar itinerario/i })
    expect(btn).toBeDisabled()
  })

  it('shows loading text when isLoading is true', () => {
    renderWithProviders(<PlannerForm onSubmit={vi.fn()} isLoading />)
    expect(screen.getByText(/Generando.../i)).toBeInTheDocument()
  })

  it('enables submit button when date and city are filled', async () => {
    renderWithProviders(<PlannerForm onSubmit={vi.fn()} isLoading={false} />)

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const dateStr = today.toISOString().split('T')[0]

    fireEvent.change(screen.getByLabelText(/Fecha del plan/i), { target: { value: dateStr } })
    fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: 'Buenos Aires' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generar itinerario/i })).not.toBeDisabled()
    })
  })

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<PlannerForm onSubmit={onSubmit} isLoading={false} />)

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const dateStr = today.toISOString().split('T')[0]

    fireEvent.change(screen.getByLabelText(/Fecha del plan/i), { target: { value: dateStr } })
    fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: 'Córdoba' } })
    fireEvent.change(screen.getByLabelText(/Presupuesto/i), { target: { value: '3000' } })

    fireEvent.click(screen.getByRole('button', { name: /Generar itinerario/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ date: dateStr, city: 'Córdoba', budget: '3000' })
      )
    })
  })
})
