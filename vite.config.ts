// vite.config.ts — build + test config (Vite for the app, Vitest for tests)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // `npm run coverage`: M1 definition of done is >= 90% line coverage on src/engine (D16)
    coverage: { provider: 'v8', include: ['src/engine/**'], reporter: ['text'], thresholds: { lines: 90 } },
  },
})