import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const input = fileURLToPath(new URL('./index.html', import.meta.url));

export default defineConfig(({ command }) => ({
  ...(command === 'build' ? { root } : {}),
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      ...(command === 'build' ? { input } : {}),
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'vendor';
          if (/[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/.test(id)) return 'antd-icons';
          if (/[\\/]node_modules[\\/]rc-[^\\/]+[\\/]/.test(id)) return 'antd-rc';
          if (/[\\/]node_modules[\\/]antd[\\/]/.test(id)) return 'antd';
          if (/[\\/]node_modules[\\/](react-hook-form|zod|@hookform[\\/]resolvers)[\\/]/.test(id)) return 'forms';
          if (/[\\/]node_modules[\\/]axios[\\/]/.test(id)) return 'http';
          return 'vendor-misc';
        }
      }
    }
  }
}));
