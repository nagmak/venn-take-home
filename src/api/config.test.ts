import { afterEach, describe, expect, it, vi } from 'vitest'

describe('API config', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('throws a helpful error when VITE_API_BASE_URL is missing', async () => {
    // config.ts reads the env at import time, and the test setup has already
    // imported it via the MSW handlers, so load a fresh copy.
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', '')

    await expect(import('./config')).rejects.toThrow('Copy .env.example to .env')
  })
})
