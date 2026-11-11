import { queryOptions } from '@tanstack/react-query'
import { validateCorporationNumber } from '../../api/onboarding'

/**
 * The TanStack Query definition for checking a corporation number. TanStack
 * Query caches each answer and shares a request already in flight, so each
 * number is requested once.
 *
 * This is the one place the value is normalized, for both the request and the
 * cache key, so "Checking…" and the check always agree on which number it is.
 */
export const corporationNumberQuery = (value: string) => {
  const corporationNumber = value.trim()
  return queryOptions({
    queryKey: ['corporationNumber', corporationNumber],
    queryFn: () => validateCorporationNumber(corporationNumber),
    // A number's answer doesn't change, so it is kept for the whole session
    // and never refetched. Failures aren't cached as answers, so the next
    // check retries.
    staleTime: Infinity,
    gcTime: Infinity,
    // By default TanStack Query pauses requests while the browser reports it is
    // offline, which would leave the check (and submit) waiting with no
    // message. Always try, so an offline check fails and says so.
    networkMode: 'always',
  })
}
