import { act, renderHook } from '@testing-library/react'
import { http } from 'msw'
import { expect, it } from 'vitest'
import { CORPORATION_URL } from '../../../test/mocks/corporationApi'
import { VALID_CORPORATION_NUMBERS } from '../../../test/mocks/handlers'
import { server } from '../../../test/mocks/server'
import { createQueryClientWrapper } from '../../../test/render'
import type { OnboardingFormValues } from '../onboardingSchema'
import { useOnboardingForm } from './useOnboardingForm'

const [VALID, OTHER_VALID] = VALID_CORPORATION_NUMBERS

it('checks the same corporation number it submits, even if the value changes mid-submit', async () => {
  const checked: string[] = []
  server.use(
    http.get(CORPORATION_URL, ({ params }) => {
      checked.push(String(params.number))
      // Fall through to the default handler.
    }),
  )
  const { wrapper } = createQueryClientWrapper()
  const { result } = renderHook(() => useOnboardingForm(), { wrapper })
  act(() => {
    // Register the fields as the form's inputs do, so submit validates them.
    for (const name of ['firstName', 'lastName', 'phone', 'corporationNumber'] as const) result.current.register(name)
    result.current.setValue('firstName', 'Ada')
    result.current.setValue('lastName', 'Lovelace')
    result.current.setValue('phone', '+13062776103')
    result.current.setValue('corporationNumber', VALID)
  })

  let submitted: OnboardingFormValues | undefined
  await act(async () => {
    const submitting = result.current.handleSubmit((values) => {
      submitted = values
    })()
    // Changed by code (a user can't edit mid-submit: the fields are read-only).
    result.current.setValue('corporationNumber', OTHER_VALID)
    await submitting
  })

  expect(checked).toEqual([submitted?.corporationNumber])
})
