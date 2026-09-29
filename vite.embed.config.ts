import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Embeddable bundle: one self-contained script (React included) that registers <momo-product-card>.
 * IIFE rather than ES: Vite never minifies whitespace for ES library builds, and a classic <script>
 * also works from file://. Public API is exposed as `window.MomoCards`.
 * Output goes to public/embed/ so both the dev server and the showroom build serve it next to sample.html.
 */
export default defineConfig({
  plugins: [react()],
  // Library mode leaves process.env.NODE_ENV untouched; React needs it replaced to pick its production build.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  publicDir: false,
  build: {
    outDir: 'public/embed',
    emptyOutDir: true,
    lib: {
      entry: 'src/embed/index.ts',
      name: 'MomoCards',
      formats: ['iife'],
      fileName: () => 'momo-cards.js',
    },
  },
})
