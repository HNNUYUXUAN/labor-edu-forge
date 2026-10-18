import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { deny: ['.env', '.env.*', '**/*.pem', '**/*.key', '**/.git/**', '**/server/data/**', '**/server/server/data/**', '**/output/**'] },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:37856',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: { '/api': { target: process.env.VITE_API_TARGET || 'http://127.0.0.1:37856', changeOrigin: true } },
  },
})
