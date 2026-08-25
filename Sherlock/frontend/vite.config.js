import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../../public/sherlock',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  optimizeDeps: {
    include: ['@mediapipe/face_detection']
  },
  resolve: {
    alias: {
      '@mediapipe/face_detection': '@mediapipe/face_detection/face_detection.js'
    }
  }
})
