import { useCallback, useRef } from 'react'
import { validateCorporationNumber } from '../../../api/onboarding'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'

/**
 * Checks a corporation number against the API. Returns an error message, or
 * undefined if it is valid. Answers are cached per number so re-validating the
 * same value (e.g. on submit) doesn't call the API again; failures aren't
 * cached, so the next attempt retries.
 */
export function useCorporationValidation() {
  const answers = useRef(new Map<string, string | undefined>())

  return useCallback(async (corporationNumber: string) => {
    if (answers.current.has(corporationNumber)) return answers.current.get(corporationNumber)

    try {
      const result = await validateCorporationNumber(corporationNumber)
      const error = result.valid ? undefined : result.message
      answers.current.set(corporationNumber, error)
      return error
    } catch {
      return UNAVAILABLE_MESSAGE
    }
  }, [])
}
