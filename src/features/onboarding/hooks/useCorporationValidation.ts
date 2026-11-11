import { useCallback, useRef, useState } from 'react'
import { validateCorporationNumber } from '../../../api/onboarding'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'

type InFlight = { corporationNumber: string; controller: AbortController }

/**
 * Checks corporation numbers against the API. `check` resolves to an error
 * message, or undefined if the number is valid. `isChecking` is true while a
 * request for the most recently checked number is pending.
 *
 * - Each number is requested once: answers and in-flight checks are shared.
 * - Checking a different number aborts the request still in flight.
 * - Failures aren't cached, so the next attempt retries.
 */
export function useCorporationValidation() {
  const checks = useRef(new Map<string, Promise<string | undefined>>())
  const inFlight = useRef<InFlight | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const check = useCallback((corporationNumber: string) => {
    const stopInFlight = () => {
      inFlight.current?.controller.abort()
      inFlight.current = null
      setIsChecking(false)
    }

    const existing = checks.current.get(corporationNumber)
    if (existing) {
      // A request for a different number is now stale.
      if (inFlight.current && inFlight.current.corporationNumber !== corporationNumber) stopInFlight()
      return existing
    }

    stopInFlight()
    const request: InFlight = { corporationNumber, controller: new AbortController() }
    inFlight.current = request
    setIsChecking(true)

    const done = () => {
      if (inFlight.current !== request) return
      inFlight.current = null
      setIsChecking(false)
    }

    const pending = validateCorporationNumber(corporationNumber, request.controller.signal).then(
      (result) => {
        done()
        return result.valid ? undefined : result.message
      },
      () => {
        checks.current.delete(corporationNumber)
        done()
        // Never treat an unverified number as valid, including when the check
        // was cancelled: on blur react-hook-form ignores the result (the value
        // changed), and a submit sharing this check is blocked.
        return UNAVAILABLE_MESSAGE
      },
    )
    checks.current.set(corporationNumber, pending)
    return pending
  }, [])

  return { check, isChecking }
}
