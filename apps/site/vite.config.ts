import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: isDev ? {
      port: 3000,
      host: '127.0.0.1',
      fs: {
        allow: [path.resolve(__dirname, '..', '..')]
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        }
      }
    } : undefined,
  }
});
