import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Hola</Button>)
    expect(screen.getByRole('button', { name: 'Hola' })).toBeInTheDocument()
  })

  it('is disabled when isLoading', () => {
    render(<Button isLoading>Enviar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Enviar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('fires onClick when clicked', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Clic</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Clic</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('renders leftIcon when not loading', () => {
    render(
      <Button leftIcon={<span data-testid="icon" />}>Texto</Button>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('hides leftIcon and shows spinner when loading', () => {
    render(
      <Button isLoading leftIcon={<span data-testid="icon" />}>Texto</Button>
    )
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  })

  it('applies danger variant class', () => {
    render(<Button variant="danger">Eliminar</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')
  })

  it('applies sm size class', () => {
    render(<Button size="sm">Pequeño</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3')
  })
})
