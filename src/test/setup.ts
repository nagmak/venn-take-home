import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Fail any test that hits a network endpoint without a handler.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  // Listeners a test adds with server.events.on, even if it failed before removing them.
  server.events.removeAllListeners()
})
afterAll(() => server.close())
