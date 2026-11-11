import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Fail the build, not the deployed page, when the API URL is missing.
  if (command === 'build' && !loadEnv(mode, process.cwd()).VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set. Copy .env.example to .env.')
  }

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Fixed fake host: tests never depend on a local .env or reach the real API.
      env: { VITE_API_BASE_URL: 'https://api.test' },
    },
  }
})
