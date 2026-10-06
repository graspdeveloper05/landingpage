import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where the API runs in development, when it is on another port.
  const api = /^https?:\/\//.test(env.VITE_API_BASE_URL ?? '')
    ? env.VITE_API_BASE_URL.replace(/\/+$/, '')
    : 'http://localhost:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      /*
       * Files uploaded in the panel (sponsor logos, the hero photograph) are
       * saved under the API's /storage and addressed by that path alone. Live,
       * the site and the API share one origin, so the path just works. In
       * development the site is on Vite's port and the API on its own, so
       * without this the images break: Vite answers /storage with the page.
       * Development only; the build is untouched.
       */
      proxy: {
        '/storage': { target: api, changeOrigin: true },
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      // §12 — good loading speed. Split the router out of the entry chunk.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
