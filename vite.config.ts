import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const input = fileURLToPath(new URL('./index.html', import.meta.url));

export default defineConfig(({ command }) => ({
  ...(command === 'build' ? { root } : {}),
  plugins: [react()],
  build: {
    rollupOptions: {
      ...(command === 'build' ? { input } : {})
    }
  }
}));
