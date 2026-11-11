import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Fixed fake host: tests never depend on a local .env or reach the real API.
    env: { VITE_API_BASE_URL: 'https://api.test' },
  },
})
