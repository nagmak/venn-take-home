import { useCallback, useEffect, useRef, useState } from 'react'
import { validateCorporationNumber } from '../../../api/onboarding'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'
const CANCELLED_MESSAGE = 'Checking was interrupted. Please try again.'

type InFlight = { corporationNumber: string; controller: AbortController }

/**
 * Checks corporation numbers against the API. `check` resolves to an error
 * message, or undefined if the number is valid. `checkingNumber` is the number
 * whose request is pending, or null.
 *
 * - Each number is requested once: answers and in-flight checks are shared.
 * - Checking a different number aborts the request still in flight.
 * - Failures aren't cached, so the next attempt retries.
 */
export function useCorporationValidation() {
  const checks = useRef(new Map<string, Promise<string | undefined>>())
  const inFlight = useRef<InFlight | null>(null)
  const [checkingNumber, setCheckingNumber] = useState<string | null>(null)

  // Cancel a pending request if the form goes away.
  useEffect(() => () => inFlight.current?.controller.abort(), [])

  const check = useCallback((corporationNumber: string) => {
    const stopInFlight = () => {
      if (inFlight.current) {
        inFlight.current.controller.abort()
        // Drop it now, not when the rejection lands, so a check for this number in the meantime starts fresh.
        checks.current.delete(inFlight.current.corporationNumber)
      }
      inFlight.current = null
      setCheckingNumber(null)
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
    setCheckingNumber(corporationNumber)

    const done = () => {
      if (inFlight.current !== request) return
      inFlight.current = null
      setCheckingNumber(null)
    }

    const pending = validateCorporationNumber(corporationNumber, request.controller.signal).then(
      (result) => {
        done()
        return result.valid ? undefined : result.message
      },
      () => {
        checks.current.delete(corporationNumber)
        done()
        // Never treat an unverified number as valid. A cancelled check is a
        // stale blur result (react-hook-form ignores it, as the value changed)
        // or an unmount; fields are read-only while submitting, so a submit's
        // check can't be cancelled by an edit.
        return request.controller.signal.aborted ? CANCELLED_MESSAGE : UNAVAILABLE_MESSAGE
      },
    )
    checks.current.set(corporationNumber, pending)
    return pending
  }, [])

  return { check, checkingNumber }
}
