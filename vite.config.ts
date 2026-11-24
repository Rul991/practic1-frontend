import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import process from "node:process"
import { resolve } from "node:path"
const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      '/api/v1': {
        target: 'https://rulvps.duckdns.org/surveys',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@styles': resolve(import.meta.dirname, './src/styles')
    }
  },
}))
