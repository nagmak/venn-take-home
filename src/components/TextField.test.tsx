import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('is valid and has no description when there is no error', () => {
    render(<TextField label="First Name" />)
    const input = screen.getByRole('textbox', { name: 'First Name' })

    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('marks the input invalid, describes it with the error, and puts the error in a live region', () => {
    render(<TextField label="First Name" error="First name is required" />)
    const input = screen.getByRole('textbox', { name: 'First Name' })

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('First name is required')
    expect(screen.getByText('First name is required')).toHaveAttribute('aria-live', 'polite')
  })

  it('gives each instance a unique id', () => {
    render(
      <>
        <TextField label="First Name" />
        <TextField label="Last Name" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'First Name' }).id).not.toBe(
      screen.getByRole('textbox', { name: 'Last Name' }).id,
    )
  })

  it('forwards ref and onBlur to the input', async () => {
    const onBlur = vi.fn()
    const ref = { current: null as HTMLInputElement | null }
    render(<TextField label="First Name" onBlur={onBlur} ref={ref} />)
    const input = screen.getByRole('textbox', { name: 'First Name' })

    expect(ref.current).toBe(input)

    await userEvent.click(input)
    await userEvent.tab()
    expect(onBlur).toHaveBeenCalledOnce()
  })
})
