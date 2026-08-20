import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
  },
  plugins: []
});
