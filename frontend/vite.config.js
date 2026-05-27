import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/autopropel/',
  build: {
    outDir: '../src/main/resources/static/autopropel',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:9090'
    }
  }
})
