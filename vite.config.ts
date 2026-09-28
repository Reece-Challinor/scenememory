import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
});
