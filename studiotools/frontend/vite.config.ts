import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.resolve(__dirname, './src'),
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 3000
    },
    proxy: {
      "/api":{
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})