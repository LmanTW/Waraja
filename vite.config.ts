import preact from '@preact/preset-vite';
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: path.join(__dirname, 'src', 'frontend'),

  server: {
    port: 8080
  },

  build: {
    outDir: path.join(__dirname, 'src', 'backend', 'dist')
  },

  plugins: [
    preact()
  ]
})
