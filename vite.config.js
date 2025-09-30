import { defineConfig } from 'vite'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          stockfish: ['./stockfish.js']
        }
      }
    }
  },
  plugins: [
    {
      name: 'copy-stockfish',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'stockfish.js'),
          resolve(__dirname, 'dist/stockfish.js')
        )
      }
    }
  ]
})