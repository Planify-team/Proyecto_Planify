import { render, screen } from '@testing-library/react'
import { RatingBadge } from '../ReviewSection'

describe('RatingBadge', () => {
  it('renders average and count', () => {
    render(<RatingBadge average={4.2} count={17} />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    expect(screen.getByText('(17)')).toBeInTheDocument()
  })

  it('returns null when count is 0', () => {
    const { container } = render(<RatingBadge average={0} count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('formats average to one decimal', () => {
    render(<RatingBadge average={3} count={5} />)
    expect(screen.getByText('3.0')).toBeInTheDocument()
  })
})
