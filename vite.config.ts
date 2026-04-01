import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/reactflow') || id.includes('node_modules/@dagrejs')) {
            return 'flow-vendor'
          }
          if (id.includes('node_modules/html-to-image') || id.includes('node_modules/jspdf')) {
            return 'export-vendor'
          }
        },
      },
    },
  },
})
