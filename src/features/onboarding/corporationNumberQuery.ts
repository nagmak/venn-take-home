import { queryOptions } from '@tanstack/react-query'
import { validateCorporationNumber } from '../../api/onboarding'

/**
 * Checks a corporation number with the API. Each answer is cached and a
 * request in flight is shared, so each number is requested once.
 */
export const corporationNumberQuery = (value: string) => {
  const corporationNumber = value.trim()
  return queryOptions({
    queryKey: ['corporationNumber', corporationNumber],
    queryFn: () => validateCorporationNumber(corporationNumber),
    // Answers are kept for the session; failed requests aren't, so they retry.
    staleTime: Infinity,
    gcTime: Infinity,
    // Fail while offline instead of pausing, so the user sees an error.
    networkMode: 'always',
  })
}
