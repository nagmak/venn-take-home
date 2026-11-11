import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'
import { ApiError, NETWORK_ERROR_STATUS, request } from './client'
import { API_BASE_URL } from './config'

const URL = `${API_BASE_URL}/example`

describe('request', () => {
  it('throws ApiError with the status and the API message for non-OK responses', async () => {
    server.use(http.get(URL, () => HttpResponse.json({ message: 'Invalid phone number' }, { status: 400 })))

    await expect(request('/example')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Invalid phone number',
    })
  })

  it('normalizes network failures into an ApiError', async () => {
    server.use(http.get(URL, () => HttpResponse.error()))

    const error = await request('/example').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: NETWORK_ERROR_STATUS })
  })
})
