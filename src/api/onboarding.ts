import { z } from 'zod'
import type { OnboardingFormValues } from '../features/onboarding/schema'
import { ApiError, request } from './client'

const corporationNumberResponse = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
})

export type CorporationNumberResult = { valid: true } | { valid: false; message: string }

export async function validateCorporationNumber(
  corporationNumber: string,
  signal?: AbortSignal,
): Promise<CorporationNumberResult> {
  let body: unknown
  try {
    body = await request(`/corporation-number/${encodeURIComponent(corporationNumber)}`, { signal })
  } catch (error) {
    // The API answers an unknown number with 404 and { valid: false, message }.
    if (!(error instanceof ApiError && error.status === 404)) throw error
    body = error.body
  }

  const result = corporationNumberResponse.parse(body)
  return result.valid
    ? { valid: true }
    : { valid: false, message: result.message ?? 'Invalid corporation number' }
}

/** Resolves on 200. A 400 rejects with an ApiError carrying the API's message. */
export function submitProfileDetails(payload: OnboardingFormValues): Promise<void> {
  return request('/profile-details', { method: 'POST', json: payload })
}
