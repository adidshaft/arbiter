import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  envDir: path.resolve(currentDirectory, '../..'),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  }
})
