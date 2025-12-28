import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../api/public',
    emptyOutDir: false, // Don't empty the directory to preserve apiDocs.html and darkTheme.css
    chunkSizeWarningLimit: 600, // Increase threshold to 600 KB (current bundle is ~560 KB)
  },
})

