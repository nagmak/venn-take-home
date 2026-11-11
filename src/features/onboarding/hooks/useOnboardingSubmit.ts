import { useCallback, useState, type BaseSyntheticEvent } from 'react'
import type { UseFormHandleSubmit } from 'react-hook-form'
import { ApiError, NETWORK_ERROR_STATUS } from '../../../api/client'
import { submitProfileDetails } from '../../../api/onboarding'
import type { OnboardingFormValues } from '../onboardingSchema'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export type SubmitStatus =
  | { state: 'idle' }
  | { state: 'success' }
  | { state: 'error'; message: string }

/** Returns the form's submit handler and the result of the last attempt. */
export function useOnboardingSubmit(handleSubmit: UseFormHandleSubmit<OnboardingFormValues>) {
  const [status, setStatus] = useState<SubmitStatus>({ state: 'idle' })

  const send = useCallback(async (values: OnboardingFormValues) => {
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

  const onSubmit = useCallback(
    (event?: BaseSyntheticEvent) => {
      setStatus({ state: 'idle' })
      return handleSubmit(send)(event)
    },
    [handleSubmit, send],
  )

  return { status, onSubmit }
}
