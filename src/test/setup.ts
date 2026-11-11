import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Fail any test that hits a network endpoint without a handler.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  // Defensive: no test adds server.events listeners today, but one that did
  // would otherwise leak into later tests.
  server.events.removeAllListeners()
})
afterAll(() => server.close())
