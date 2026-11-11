import { screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { createGate } from '../../../test/gate'
import { CORPORATION_URL, holdCorporationChecks, PROFILE_URL } from '../../../test/mocks/corporationApi'
import { VALID_CORPORATION_NUMBERS } from '../../../test/mocks/handlers'
import { server } from '../../../test/mocks/server'
import { renderWithQueryClient } from '../../../test/render'
import { OnboardingForm } from './OnboardingForm'

const [VALID, OTHER_VALID] = VALID_CORPORATION_NUMBERS
const INVALID = '000000000'
const SUCCESS = 'Thanks! Your details have been submitted.'

const renderForm = () => renderWithQueryClient(<OnboardingForm />)

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
  await user.type(field('Corporation Number'), VALID)
}

describe('OnboardingForm', () => {
  it('validates on blur and clears the error once the value is fixed', async () => {
    const user = userEvent.setup()
    renderForm()

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
    renderForm()

    // Checks the attribute instead of typing past the limit, because of a bug in
    // @testing-library/user-event: it lists the phone input type as "telephone"
    // instead of "tel", so it ignores maxlength on phone fields. Real browsers
    // enforce it. Don't change type="tel" to work around this; it gives mobile
    // users the phone keypad.
    expect(field(label)).toHaveAttribute('maxLength', String(limit))
  })

  it('on submit, shows an error under every empty field, focuses the first and asks to fix them', async () => {
    const user = userEvent.setup()
    renderForm()

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
    await typeAndBlur(user, 'Corporation Number', VALID)

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
    renderForm()

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
    renderForm()

    await typeAndBlur(user, 'Corporation Number', INVALID)
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
    const api = holdCorporationChecks(VALID)
    const user = userEvent.setup()
    renderForm()

    await typeAndBlur(user, 'Corporation Number', VALID)

    expect(await screen.findByText('Checking…')).toBeInTheDocument()
    expect(field('Corporation Number')).not.toHaveAttribute('aria-invalid')
    api.release(VALID)
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument())
  })

  it("ignores a stale check's late answer once the field holds a different number", async () => {
    const api = holdCorporationChecks(INVALID)
    const user = userEvent.setup()
    const { waitForCheckHandled } = renderForm()

    await typeAndBlur(user, 'Corporation Number', INVALID)
    await typeAndBlur(user, 'Corporation Number', VALID)
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument())

    // The invalid number's answer arrives only now, while the field holds the valid one.
    api.release(INVALID)
    await waitForCheckHandled(INVALID)

    expect(field('Corporation Number')).not.toHaveAttribute('aria-invalid')
    expect(field('Corporation Number')).not.toHaveAccessibleDescription()
  })

  it('locks the fields while submitting, so the number sent is the number checked', async () => {
    let body: unknown
    server.use(
      http.post(PROFILE_URL, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const api = holdCorporationChecks(VALID)
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    // Try to change the number while its check is pending: without the lock,
    // this deletes the last digit and types a 1.
    expect(field('Corporation Number')).toHaveAttribute('readonly')
    await user.type(field('Corporation Number'), '{Backspace}1')
    api.release(VALID)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))
    expect(field('Corporation Number')).toHaveValue(VALID)
    expect(body).toMatchObject({ corporationNumber: VALID })
  })

  it('shows the field\'s own error, not "Checking…", once its value no longer matches the pending check', async () => {
    const api = holdCorporationChecks(VALID)
    const user = userEvent.setup()
    const { waitForCheckHandled } = renderForm()

    await typeAndBlur(user, 'Corporation Number', VALID)
    expect(await screen.findByText('Checking…')).toBeInTheDocument()

    await user.clear(field('Corporation Number'))
    await user.tab()
    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number is required')

    // The valid answer for the old value must not clear the current error.
    api.release(VALID)
    await waitForCheckHandled(VALID)
    expect(field('Corporation Number')).toHaveAccessibleDescription('Corporation number is required')
    expect(field('Corporation Number')).toHaveAttribute('aria-invalid', 'true')
  })

  it("shows an already-checked number's answer at once, while another number is still being checked", async () => {
    const api = holdCorporationChecks(INVALID)
    const user = userEvent.setup()
    const { waitForCheckHandled } = renderForm()

    await typeAndBlur(user, 'Corporation Number', VALID)
    await waitFor(() => expect(screen.queryByText('Checking…')).not.toBeInTheDocument())
    await typeAndBlur(user, 'Corporation Number', INVALID)
    expect(await screen.findByText('Checking…')).toBeInTheDocument()

    await typeAndBlur(user, 'Corporation Number', VALID)

    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
    expect(field('Corporation Number')).not.toHaveAccessibleDescription()
    // Let the held check finish inside the test, not during teardown.
    api.release(INVALID)
    await waitForCheckHandled(INVALID)
  })

  it('checks each corporation number with the API only once', async () => {
    let apiCalls = 0
    server.use(
      http.get(CORPORATION_URL, () => {
        apiCalls++
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.tab()
    await typeAndBlur(user, 'Corporation Number', VALID)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))
    expect(apiCalls).toBe(1)
  })

  it('asks the user to retry when the corporation number cannot be checked, and retries on the next blur', async () => {
    server.use(http.get(CORPORATION_URL, () => HttpResponse.error(), { once: true }))
    const user = userEvent.setup()
    renderForm()

    await typeAndBlur(user, 'Corporation Number', VALID)
    await waitFor(() =>
      expect(field('Corporation Number')).toHaveAccessibleDescription(
        'Could not verify corporation number. Please try again.',
      ),
    )

    // The failure isn't cached: blurring again asks the API again, which now answers.
    await user.click(field('Corporation Number'))
    await user.tab()
    await waitFor(() => expect(field('Corporation Number')).not.toHaveAccessibleDescription())
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
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))
    expect(body).toEqual({
      firstName: 'Hello',
      lastName: 'World',
      phone: '+13062776103',
      corporationNumber: VALID,
    })
  })

  it('shows the API message when the submission is rejected', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.json({ message: 'Invalid phone number' }, { status: 400 })))
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid phone number'))
  })

  it('asks the user to check their connection when the submission cannot be sent', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.error()))
    const user = userEvent.setup()
    renderForm()

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
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'),
    )
    expect(screen.queryByText(/db timeout/)).not.toBeInTheDocument()
  })

  it('clears the previous success when a later submit fails validation', async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))

    await user.clear(field('First Name'))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.'))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('clears the previous result as soon as a new submit starts', async () => {
    const api = holdCorporationChecks(OTHER_VALID)
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))

    await user.clear(field('Corporation Number'))
    await user.type(field('Corporation Number'), OTHER_VALID)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    // While the new number is still being checked, the old success is gone.
    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    api.release(OTHER_VALID)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))
  })

  it('does not bring back an old API error once the fields are fixed', async () => {
    server.use(http.post(PROFILE_URL, () => HttpResponse.json({ message: 'Invalid phone number' }, { status: 400 })))
    const user = userEvent.setup()
    renderForm()

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
    const response = createGate()
    server.use(
      http.post(PROFILE_URL, async () => {
        posts++
        await response.opened
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.dblClick(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByRole('button', { name: 'Submitting…' })).toBeDisabled()
    response.open()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(SUCCESS))
    expect(posts).toBe(1)
  })
})
