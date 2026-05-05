import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind on all interfaces so LAN access works; pairs well with ngrok forwarding to localhost.
    host: true,
    port: 5173,
    // Vite blocks unknown Host headers; ngrok uses *.ngrok-free.dev / *.ngrok-free.app / *.ngrok.app
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
    // One ngrok URL: browser calls same-origin /api/*; Vite forwards to the API (avoids ERR_NGROK_334
    // from a second tunnel on the same free-tier dev hostname).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
})
