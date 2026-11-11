import { API_BASE_URL } from './config'

/** Status used for requests that never got a response (offline, DNS, CORS). */
export const NETWORK_ERROR_STATUS = 0

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  json?: unknown
}

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const messageFrom = (body: unknown) =>
  typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
    ? body.message
    : undefined

/**
 * Sends a request to the API and returns the parsed JSON body.
 * Throws ApiError for non-2xx responses and for network failures
 * (status NETWORK_ERROR_STATUS).
 */
export async function request<T>(path: string, { method = 'GET', json }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: json === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: json === undefined ? undefined : JSON.stringify(json),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, 'Network error. Check your connection and try again.')
  }

  const body = await parseBody(response)
  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(body) ?? `Request failed with status ${response.status}`, body)
  }
  return body as T
}
