import { useCallback, useEffect, useRef, useState } from 'react'
import { validateCorporationNumber } from '../../../api/onboarding'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'

const normalize = (corporationNumber: string) => corporationNumber.trim()

/**
 * Checks corporation numbers against the API. `check` resolves to an error
 * message, or undefined if the number is valid. `isChecking(value)` says
 * whether that value's request is still pending. Both normalize the value the
 * same way.
 *
 * - Each number is requested once: answers and pending checks are shared.
 * - A check is never cancelled by checking another number, so every caller
 *   gets the real answer. react-hook-form ignores a blur result once the
 *   field's value has changed, so a slow answer can't land on a newer value.
 * - Failures aren't cached, so the next attempt retries.
 */
export function useCorporationValidation() {
  const checks = useRef(new Map<string, Promise<string | undefined>>())
  const controllers = useRef(new Set<AbortController>())
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())

  // Cancel pending requests if the form goes away.
  useEffect(() => {
    const active = controllers.current
    return () => active.forEach((controller) => controller.abort())
  }, [])

  const check = useCallback((value: string) => {
    const corporationNumber = normalize(value)
    const existing = checks.current.get(corporationNumber)
    if (existing) return existing

    const controller = new AbortController()
    controllers.current.add(controller)
    setPending((numbers) => new Set(numbers).add(corporationNumber))

    const settle = () => {
      controllers.current.delete(controller)
      setPending((numbers) => {
        const next = new Set(numbers)
        next.delete(corporationNumber)
        return next
      })
    }

    const request = validateCorporationNumber(corporationNumber, controller.signal).then(
      (result) => {
        settle()
        return result.valid ? undefined : result.message
      },
      () => {
        // Nothing else replaces an entry while it's pending, so this is ours.
        checks.current.delete(corporationNumber)
        settle()
        // Never treat an unverified number as valid (this includes an unmount's abort).
        return UNAVAILABLE_MESSAGE
      },
    )
    checks.current.set(corporationNumber, request)
    return request
  }, [])

  const isChecking = useCallback((value: string) => pending.has(normalize(value)), [pending])

  return { check, isChecking }
}
