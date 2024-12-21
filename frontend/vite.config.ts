// Satisfactory_App/frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true }),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,      // Ensure the port matches your exposed Docker port
  }
})
