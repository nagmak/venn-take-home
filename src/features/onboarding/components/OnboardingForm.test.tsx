import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../../../api/config'
import { VALID_CORPORATION_NUMBERS } from '../../../test/mocks/handlers'
import { server } from '../../../test/mocks/server'
import { OnboardingForm } from './OnboardingForm'

const CORPORATION_URL = `${API_BASE_URL}/corporation-number/:number`
const PROFILE_URL = `${API_BASE_URL}/profile-details`

const field = (label: string) => screen.getByRole('textbox', { name: label })

const typeAndBlur = async (user: UserEvent, label: string, value: string) => {
  await user.clear(field(label))
  await user.type(field(label), value)
  await user.tab()
}

const fillValidForm = async (user: UserEvent) => {
  await user.type(field('First Name'), '  Hello ')
  await user.type(field('Last Name'), 'World')
  await user.type(field('Phone Number'), '+13062776103')
  await user.type(field('Corporation Number'), VALID_CORPORATION_NUMBERS[0])
}

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

  it('checks the corporation number with the API on blur, once its format is valid', async () => {
    let apiCalls = 0
    server.use(
      http.get(CORPORATION_URL, () => {
        apiCalls++
        // Fall through to the default handler.
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', '12345')
    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number must be 9 digits')
    expect(apiCalls).toBe(0)

    await typeAndBlur(user, 'Corporation Number', '000000000')
    await waitFor(() =>
      expect(field('Corporation Number')).toHaveAccessibleDescription('Invalid corporation number'),
    )

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])
    await waitFor(() => expect(field('Corporation Number')).not.toHaveAttribute('aria-invalid'))
    expect(apiCalls).toBe(2)
  })

  it('keeps the corporation number error when other fields are blurred and on submit', async () => {
    let posts = 0
    server.use(
      http.post(PROFILE_URL, () => {
        posts++
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', '000000000')
    await waitFor(() =>
      expect(field('Corporation Number')).toHaveAccessibleDescription('Invalid corporation number'),
    )

    await typeAndBlur(user, 'First Name', 'Ada')
    await typeAndBlur(user, 'Last Name', 'Lovelace')
    await typeAndBlur(user, 'Phone Number', '+13062776103')
    expect(field('Corporation Number')).toHaveAccessibleDescription('Invalid corporation number')

    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(field('Corporation Number')).toHaveAccessibleDescription('Invalid corporation number'),
    )
    expect(posts).toBe(0)
  })

  it('asks the user to retry when the corporation number cannot be checked', async () => {
    server.use(http.get(CORPORATION_URL, () => HttpResponse.error()))
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])

    await waitFor(() =>
      expect(field('Corporation Number')).toHaveAccessibleDescription(
        'Could not verify corporation number. Please try again.',
      ),
    )
  })

  it('submits the trimmed values and confirms success', async () => {
    let body: unknown
    server.use(
      http.post(PROFILE_URL, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )
    expect(body).toEqual({
      firstName: 'Hello',
      lastName: 'World',
      phone: '+13062776103',
      corporationNumber: VALID_CORPORATION_NUMBERS[0],
    })
  })

  it('shows the API message when the submission is rejected', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.json({ message: 'Invalid phone number' }, { status: 400 })))
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Invalid phone number'))
  })
})
