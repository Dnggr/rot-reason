// vite.config.ts — build + test config (Vite for the app, Vitest for tests)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
