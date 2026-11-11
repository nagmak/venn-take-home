import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../api/config'

// Test fixture only (from the brief): the app must validate against the API, never this list.
const VALID_CORPORATION_NUMBERS = [
  '826417395',
  '158739264',
  '123456789',
  '591863427',
  '312574689',
  '287965143',
  '265398741',
  '762354918',
  '468721395',
  '624719583',
] as const

export const handlers = [
  http.get(`${API_BASE_URL}/corporation-number/:number`, ({ params }) => {
    const number = String(params.number)
    return (VALID_CORPORATION_NUMBERS as readonly string[]).includes(number)
      ? HttpResponse.json({ corporationNumber: number, valid: true })
      : HttpResponse.json({ valid: false, message: 'Invalid corporation number' })
  }),
  http.post(`${API_BASE_URL}/profile-details`, () => new HttpResponse(null, { status: 200 })),
]
