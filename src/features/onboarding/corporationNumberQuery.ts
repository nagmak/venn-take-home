import { queryOptions } from '@tanstack/react-query'
import { validateCorporationNumber } from '../../api/onboarding'

/**
 * The TanStack Query definition for checking a corporation number. TanStack
 * Query caches each answer and shares a request already in flight, so an
 * accepted number is requested once.
 *
 * This is the one place the value is normalized, for both the request and the
 * cache key, so "Checking…" and the check always agree on which number it is.
 */
export const corporationNumberQuery = (value: string) => {
  const corporationNumber = value.trim()
  return queryOptions({
    queryKey: ['corporationNumber', corporationNumber],
    queryFn: () => validateCorporationNumber(corporationNumber),
    // An accepted number stays accepted, so its answer is kept for the whole
    // session. A rejected number may be registered later, so it is asked again
    // on the next check. Failures aren't cached as answers, so they retry too.
    staleTime: (query) => (query.state.data?.valid ? Infinity : 0),
    gcTime: Infinity,
    // By default TanStack Query pauses requests while the browser reports it is
    // offline, which would leave the check (and submit) waiting with no
    // message. Always try, so an offline check fails and says so.
    networkMode: 'always',
  })
}
