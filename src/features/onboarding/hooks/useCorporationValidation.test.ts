import { act, renderHook, waitFor } from '@testing-library/react'
import { delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../../../api/config'
import { VALID_CORPORATION_NUMBERS } from '../../../test/mocks/handlers'
import { server } from '../../../test/mocks/server'
import { useCorporationValidation } from './useCorporationValidation'

const [VALID] = VALID_CORPORATION_NUMBERS
const INVALID = '000000000'

const slowApi = () =>
  server.use(
    http.get(`${API_BASE_URL}/corporation-number/:number`, async () => {
      await delay(50)
      // Fall through to the default handler.
    }),
  )

describe('useCorporationValidation', () => {
  it("checking another number doesn't cancel a pending check: each gets its real answer", async () => {
    slowApi()
    const { result } = renderHook(() => useCorporationValidation())

    let checks: Promise<string | undefined>[] = []
    act(() => {
      checks = [result.current.check(VALID), result.current.check(INVALID)]
    })

    expect(await Promise.all(checks)).toEqual([undefined, 'Invalid corporation number'])
  })

  it('reports a value as being checked however it is padded, until its answer arrives', async () => {
    slowApi()
    const { result } = renderHook(() => useCorporationValidation())

    act(() => void result.current.check(` ${VALID} `))

    expect(result.current.isChecking(VALID)).toBe(true)
    expect(result.current.isChecking(`${VALID} `)).toBe(true)
    expect(result.current.isChecking(INVALID)).toBe(false)
    await waitFor(() => expect(result.current.isChecking(VALID)).toBe(false))
  })
})
