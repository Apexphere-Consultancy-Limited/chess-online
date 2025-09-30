import { defineConfig } from 'vite'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html')
      }
    },
    emptyOutDir: true
  },
  server: {
    open: '/'
  },
  plugins: [
    {
      name: 'copy-stockfish',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'public/stockfish.js'),
          resolve(__dirname, 'dist/stockfish.js')
        )
      }
    }
  ]
})