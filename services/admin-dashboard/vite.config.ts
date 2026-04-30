import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  // In production the SPA is served by Flask at /admin-app/
  base: process.env.NODE_ENV === 'production' ? '/admin-app/' : '/',
  server: {
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:5000',
    },
  },
})
