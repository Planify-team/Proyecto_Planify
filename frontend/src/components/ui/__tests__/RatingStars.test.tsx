import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RatingStars } from '../RatingStars'

describe('RatingStars', () => {
  it('renders 5 star buttons', () => {
    render(<RatingStars value={0} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('calls onChange with correct star value', () => {
    const onChange = vi.fn()
    render(<RatingStars value={0} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3 estrellas'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn()
    render(<RatingStars value={3} onChange={onChange} readOnly />)
    fireEvent.click(screen.getByRole('img'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders accessible img with label when readOnly', () => {
    render(<RatingStars value={3} readOnly />)
    expect(screen.getByRole('img', { name: '3 de 5 estrellas' })).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('shows filled stars up to value', () => {
    render(<RatingStars value={3} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })
})
