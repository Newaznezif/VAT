import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules'; style-src 'self' * 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' * data: blob: https://fonts.gstatic.com;"
    }
  }
})
