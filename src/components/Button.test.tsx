import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to type="button" so it does not submit forms', () => {
    render(<Button>Next</Button>)

    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('type', 'button')
  })
})
