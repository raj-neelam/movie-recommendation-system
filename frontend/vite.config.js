import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/similar': {
        target: 'http://0.0.0.0:8000',
        changeOrigin: true,
      },
      '/list': {
        target: 'http://0.0.0.0:8000',
        changeOrigin: true,
      },
      '/': {
        target: 'http://0.0.0.0:8000',
        changeOrigin: true,
      },
    },
  },
});
