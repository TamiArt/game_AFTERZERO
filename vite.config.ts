import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  base: '/',
  build: {
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: mode !== 'development',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number.parseInt(process.env.PORT || '8443', 10),
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: Number.parseInt(process.env.PORT || '8443', 10),
    strictPort: true,
  },
}))
