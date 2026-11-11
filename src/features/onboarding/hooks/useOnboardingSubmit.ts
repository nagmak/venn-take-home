import { useCallback, useState } from 'react'
import { ApiError, NETWORK_ERROR_STATUS } from '../../../api/client'
import { submitProfileDetails } from '../../../api/onboarding'
import type { OnboardingFormValues } from '../onboardingSchema'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export type SubmitStatus =
  | { state: 'idle' }
  | { state: 'success' }
  | { state: 'error'; message: string }

export function useOnboardingSubmit() {
  const [status, setStatus] = useState<SubmitStatus>({ state: 'idle' })

  /** Clears the last result, e.g. when a new submit attempt fails validation. */
  const clearStatus = useCallback(() => setStatus({ state: 'idle' }), [])

  const submit = useCallback(async (values: OnboardingFormValues) => {
    setStatus({ state: 'idle' })
    try {
      await submitProfileDetails(values)
      setStatus({ state: 'success' })
    } catch (error) {
      // A 400 says which field the API rejected; a network failure says to check the connection.
      const showApiMessage =
        error instanceof ApiError && (error.status === 400 || error.status === NETWORK_ERROR_STATUS)
      setStatus({ state: 'error', message: showApiMessage ? error.message : GENERIC_ERROR })
    }
  }, [])

  return { status, submit, clearStatus }
}
