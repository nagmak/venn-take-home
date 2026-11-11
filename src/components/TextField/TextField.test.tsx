import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('is valid and has no description when there is no error', () => {
    render(<TextField label="First Name" />)
    const input = screen.getByRole('textbox', { name: 'First Name' })

    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('shows the hint, not invalid, when the error is empty', () => {
    render(<TextField label="Corporation Number" error="" hint="Checking…" />)
    const input = screen.getByRole('textbox', { name: 'Corporation Number' })

    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Checking…')
  })

  it('marks the input invalid, describes it with the error, and puts the error in a live region', () => {
    render(<TextField label="First Name" error="First name is required" />)
    const input = screen.getByRole('textbox', { name: 'First Name' })

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('First name is required')
    expect(screen.getByText('First name is required')).toHaveAttribute('aria-live', 'polite')
  })
})
