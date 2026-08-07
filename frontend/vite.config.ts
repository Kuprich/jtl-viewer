import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // все запросы /api с фронта уходят на бэкенд (без CORS)
      '/api': 'http://localhost:8080',
    },
  },
})