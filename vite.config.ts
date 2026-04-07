import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/upload-font': 'http://localhost:3001',
      '/list-fonts': 'http://localhost:3001',
      '/upload-image': 'http://localhost:3001',
      '/uploaded-images': 'http://localhost:3001',
    },
  },
})
