import { act, renderHook } from '@testing-library/react'
import { delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../../../api/config'
import { VALID_CORPORATION_NUMBERS } from '../../../test/mocks/handlers'
import { server } from '../../../test/mocks/server'
import { useCorporationValidation } from './useCorporationValidation'

const [A, B] = VALID_CORPORATION_NUMBERS

describe('useCorporationValidation', () => {
  it('does not reuse a request that was just aborted', async () => {
    server.use(
      http.get(`${API_BASE_URL}/corporation-number/:number`, async () => {
        await delay(50)
        // Fall through to the default handler.
      }),
    )
    const { result } = renderHook(() => useCorporationValidation())

    let checks: Promise<string | undefined>[] = []
    act(() => {
      // B aborts A; checking A again in the same tick must start a fresh request.
      checks = [result.current.check(A), result.current.check(B), result.current.check(A)]
    })
    const [, , againA] = await Promise.all(checks)

    expect(againA).toBeUndefined()
  })
})
