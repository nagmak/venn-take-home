import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OnboardingForm } from './OnboardingForm'

describe('OnboardingForm', () => {
  it('renders with all four labelled fields', () => {
    render(<OnboardingForm />)

    for (const label of ['First Name', 'Last Name', 'Phone Number', 'Corporation Number']) {
      expect(screen.getByRole('textbox', { name: label })).toBeInTheDocument()
    }
  })
})
