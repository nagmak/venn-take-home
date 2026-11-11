import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OnboardingForm } from './OnboardingForm'

const field = (label: string) => screen.getByRole('textbox', { name: label })

describe('OnboardingForm', () => {
  it('validates on blur and clears the error once the value is fixed', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await user.type(field('Phone Number'), '306-277-6103')
    await user.tab()
    expect(field('Phone Number')).toHaveAccessibleDescription(
      'Phone number must start with +1 followed by 10 digits',
    )
    expect(field('First Name')).not.toHaveAttribute('aria-invalid')

    await user.clear(field('Phone Number'))
    await user.type(field('Phone Number'), '+13062776103')
    await user.tab()
    expect(field('Phone Number')).not.toHaveAttribute('aria-invalid')
  })

  it.each([
    ['First Name', 50],
    ['Last Name', 50],
    ['Phone Number', 12],
    ['Corporation Number', 9],
  ])('limits %s to %i characters', (label, limit) => {
    render(<OnboardingForm />)

    // Checks the attribute instead of typing past the limit, because of a bug in
    // @testing-library/user-event: it lists the phone input type as "telephone"
    // instead of "tel", so it ignores maxlength on phone fields. Real browsers
    // enforce it. Don't change type="tel" to work around this; it gives mobile
    // users the phone keypad.
    expect(field(label)).toHaveAttribute('maxLength', String(limit))
  })

  it('on submit, shows an error under every empty field and focuses the first', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(field('First Name')).toHaveAccessibleDescription('First name is required')
    expect(field('Last Name')).toHaveAccessibleDescription('Last name is required')
    expect(field('Phone Number')).toHaveAccessibleDescription('Phone number is required')
    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number is required')
    expect(field('First Name')).toHaveFocus()
  })
})
