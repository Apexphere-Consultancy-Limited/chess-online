import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-stockfish',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'public/stockfish.js'),
          resolve(__dirname, 'dist/stockfish.js')
        )
      }
    }
  ],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    emptyOutDir: true
  },
  server: {
    open: '/'
  }
})
