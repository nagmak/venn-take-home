import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
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

  it('on submit, shows an error under every empty field, focuses the first and asks to fix them', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(field('First Name')).toHaveAccessibleDescription('First name is required')
    expect(field('Last Name')).toHaveAccessibleDescription('Last name is required')
    expect(field('Phone Number')).toHaveAccessibleDescription('Phone number is required')
    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number is required')
    expect(field('First Name')).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.')

    await typeAndBlur(user, 'First Name', 'Hello')
    await typeAndBlur(user, 'Last Name', 'World')
    await typeAndBlur(user, 'Phone Number', '+13062776103')
    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])

    await waitFor(() => expect(screen.getByRole('alert')).toBeEmptyDOMElement())
  })

  it('does not call the API while the corporation number format is invalid', async () => {
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

  it('shows "Checking…" while the corporation number is being checked', async () => {
    server.use(
      http.get(CORPORATION_URL, async () => {
        await delay(100)
        // Fall through to the default handler.
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])

    expect(await screen.findByText('Checking…')).toBeInTheDocument()
    expect(field('Corporation Number')).not.toHaveAttribute('aria-invalid')
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument())
  })

  it('aborts a stale check so its late response cannot override the current value', async () => {
    let staleStarted = false
    let staleAborted = false
    server.use(
      http.get(CORPORATION_URL, async ({ params, request }) => {
        if (params.number !== '000000000') return
        staleStarted = true
        await delay(200)
        staleAborted = request.signal.aborted
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', '000000000')
    // Wait for the request to reach the server before superseding it.
    await waitFor(() => expect(staleStarted).toBe(true))
    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])

    await waitFor(() => expect(staleAborted).toBe(true))
    expect(field('Corporation Number')).not.toHaveAttribute('aria-invalid')
    expect(field('Corporation Number')).not.toHaveAccessibleDescription()
  })

  it('locks the fields while submitting, so the number sent is the number checked', async () => {
    const [checked, other] = VALID_CORPORATION_NUMBERS
    let body: unknown
    server.use(
      http.get(CORPORATION_URL, async ({ params }) => {
        if (params.number === checked) await delay(200)
        // Fall through to the default handler.
      }),
      http.post(PROFILE_URL, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    // Check `other` first so it's cached, then submit with `checked` (slow check).
    await typeAndBlur(user, 'Corporation Number', other)
    await fillValidForm(user)
    await user.clear(field('Corporation Number'))
    await user.type(field('Corporation Number'), checked)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    // The number can't be changed mid-submit.
    expect(field('Corporation Number')).toHaveAttribute('readonly')
    await user.type(field('Corporation Number'), '1')
    await user.tab()

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )
    expect(field('Corporation Number')).toHaveValue(checked)
    expect(field('Corporation Number')).not.toHaveAccessibleDescription()
    expect(body).toMatchObject({ corporationNumber: checked })
  })

  it('shows the field\'s own error, not "Checking…", once its value no longer matches the pending check', async () => {
    server.use(
      http.get(CORPORATION_URL, async () => {
        await delay(300)
        // Fall through to the default handler.
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])
    expect(await screen.findByText('Checking…')).toBeInTheDocument()

    await user.clear(field('Corporation Number'))
    await user.tab()

    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number is required')
    expect(field('Corporation Number')).toHaveAttribute('aria-invalid', 'true')
  })

  it('stops "Checking…" when the field returns to an already-checked number', async () => {
    server.use(
      http.get(CORPORATION_URL, async ({ params }) => {
        if (params.number === '000000000') await delay(300)
        // Fall through to the default handler.
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument())
    await typeAndBlur(user, 'Corporation Number', '000000000')
    expect(await screen.findByText('Checking…')).toBeInTheDocument()

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])

    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
    await delay(400)
    expect(field('Corporation Number')).not.toHaveAccessibleDescription()
  })

  it('cancels a pending corporation check when the form unmounts', async () => {
    let aborted = false
    server.use(
      http.get(CORPORATION_URL, async ({ request }) => {
        await delay(200)
        aborted = request.signal.aborted
      }),
    )
    const user = userEvent.setup()
    const { unmount } = render(<OnboardingForm />)

    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])
    unmount()

    await waitFor(() => expect(aborted).toBe(true))
  })

  it('checks each corporation number with the API only once', async () => {
    let apiCalls = 0
    server.use(
      http.get(CORPORATION_URL, () => {
        apiCalls++
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.tab()
    await typeAndBlur(user, 'Corporation Number', VALID_CORPORATION_NUMBERS[0])
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )
    expect(apiCalls).toBe(1)
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

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid phone number'))
  })

  it('asks the user to check their connection when the submission cannot be sent', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.error()))
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Network error. Check your connection and try again.'),
    )
  })

  it('shows a generic message, not the raw API message, for a server error', async () => {
    server.use(
      http.post(PROFILE_URL, () => HttpResponse.json({ message: 'Internal: db timeout' }, { status: 500 })),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'),
    )
    expect(screen.queryByText(/db timeout/)).not.toBeInTheDocument()
  })

  it('clears the previous success when a later submit fails validation', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )

    await user.clear(field('First Name'))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.'))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('clears the previous result as soon as a new submit starts', async () => {
    const second = VALID_CORPORATION_NUMBERS[1]
    server.use(
      http.get(CORPORATION_URL, async ({ params }) => {
        if (params.number === second) await delay(200)
        // Fall through to the default handler.
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )

    await user.clear(field('Corporation Number'))
    await user.type(field('Corporation Number'), second)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    // While the new number is still being checked, the old success is gone.
    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('does not bring back an old API error once the fields are fixed', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.json({ message: 'Invalid phone number' }, { status: 400 })))
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid phone number'))

    await user.clear(field('First Name'))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.'))

    await typeAndBlur(user, 'First Name', 'Hello')
    await waitFor(() => expect(screen.getByRole('alert')).toBeEmptyDOMElement())
  })

  it('shows "Submitting…" while sending and sends only one request on a double click', async () => {
    let posts = 0
    server.use(
      http.post(PROFILE_URL, async () => {
        posts++
        await delay(100)
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await fillValidForm(user)
    await user.dblClick(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Thanks! Your details have been submitted.'),
    )
    expect(posts).toBe(1)
  })
})
