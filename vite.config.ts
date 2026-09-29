import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Showroom app build. The embeddable `momo-cards.js` bundle gets its own config (T8).
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/core/**/*.test.ts'],
  },
})
