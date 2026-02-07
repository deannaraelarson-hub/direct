import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'wallet-vendor': ['wagmi', 'viem', 'connectkit']
        }
      }
    }
  },
  server: {
    port: 3000
  }
})
