import { useCallback, useRef, useState } from 'react'
import { validateCorporationNumber } from '../../../api/onboarding'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'

export type CorporationCheckStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error'

/**
 * Checks corporation numbers against the API. `check` resolves to an error
 * message, or undefined if the number is valid.
 *
 * - Each number is requested once: answers and in-flight checks are shared.
 * - Starting a check for a different number aborts the previous request.
 * - Failures aren't cached, so the next attempt retries.
 */
export function useCorporationValidation() {
  const checks = useRef(new Map<string, Promise<string | undefined>>())
  const current = useRef<AbortController | null>(null)
  const [status, setStatus] = useState<CorporationCheckStatus>('idle')

  const check = useCallback((corporationNumber: string) => {
    const existing = checks.current.get(corporationNumber)
    if (existing) return existing

    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    setStatus('checking')

    const settle = (next: CorporationCheckStatus) => {
      if (current.current === controller) setStatus(next)
    }

    const pending = validateCorporationNumber(corporationNumber, controller.signal).then(
      (result) => {
        settle(result.valid ? 'valid' : 'invalid')
        return result.valid ? undefined : result.message
      },
      () => {
        checks.current.delete(corporationNumber)
        // An aborted check belongs to a value the user has already changed;
        // react-hook-form discards results for stale values, so it's ignored.
        if (controller.signal.aborted) return undefined
        settle('error')
        return UNAVAILABLE_MESSAGE
      },
    )
    checks.current.set(corporationNumber, pending)
    return pending
  }, [])

  return { check, status }
}
