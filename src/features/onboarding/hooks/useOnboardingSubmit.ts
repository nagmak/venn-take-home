import { useCallback, useState } from 'react'
import { ApiError } from '../../../api/client'
import { submitProfileDetails } from '../../../api/onboarding'
import type { OnboardingFormValues } from '../onboardingSchema'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export type SubmitStatus =
  | { state: 'idle' }
  | { state: 'success' }
  | { state: 'error'; message: string }

export function useOnboardingSubmit() {
  const [status, setStatus] = useState<SubmitStatus>({ state: 'idle' })

  const submit = useCallback(async (values: OnboardingFormValues) => {
    setStatus({ state: 'idle' })
    try {
      await submitProfileDetails(values)
      setStatus({ state: 'success' })
    } catch (error) {
      // A 400 carries a message saying which field the API rejected.
      const message = error instanceof ApiError && error.status === 400 ? error.message : GENERIC_ERROR
      setStatus({ state: 'error', message })
    }
  }, [])

  return { status, submit }
}
