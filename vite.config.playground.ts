import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/yes-president-game-ui/' : '/',
  plugins: [vue()],
  root: 'playground',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'yes-president-game-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      'yes-president-game-ui/style': fileURLToPath(new URL('./src/styles/index.css', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./playground-dist', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    open: false,
  },
});
