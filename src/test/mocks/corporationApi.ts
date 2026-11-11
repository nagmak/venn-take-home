import { http } from 'msw'
import { API_BASE_URL } from '../../api/config'
import { createGate } from '../gate'
import { server } from './server'

export const CORPORATION_URL = `${API_BASE_URL}/corporation-number/:number`
export const PROFILE_URL = `${API_BASE_URL}/profile-details`

/**
 * Holds the API's answer for each given number until the test calls
 * `release(number)`. Other numbers are answered at once. Answers come from the
 * default handlers.
 */
export function holdCorporationChecks(...numbers: string[]) {
  const gates = new Map(numbers.map((number) => [number, createGate()]))
  server.use(
    http.get(CORPORATION_URL, async ({ params }) => {
      await gates.get(String(params.number))?.opened
      // Fall through to the default handler.
    }),
  )
  return { release: (number: string) => gates.get(number)?.open() }
}
