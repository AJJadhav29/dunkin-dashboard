import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is set for GitHub Pages project site: https://abhyaung.github.io/dunkin-dashboard/
export default defineConfig({
  base: '/dunkin-dashboard/',
  plugins: [react()],
})
