import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['ethers'], // Explicitly externalize ethers
      output: {
        globals: {
          ethers: 'ethers'
        }
      }
    }
  }
})
