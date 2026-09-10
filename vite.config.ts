import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { buildContentSecurityPolicy } from './src/security/content-security-policy';
import { VitePWA } from 'vite-plugin-pwa';

const root = fileURLToPath(new URL('.', import.meta.url));
const input = fileURLToPath(new URL('./index.html', import.meta.url));

export default defineConfig(({ command, mode }) => ({
  ...(command === 'build' ? { root } : {}),
  plugins: [
    react(),
    {
      name: 'environment-content-security-policy',
      transformIndexHtml: (html: string) => html.replace('__CONTENT_SECURITY_POLICY__', buildContentSecurityPolicy(command === 'serve', loadEnv(mode, root).VITE_API_BASE_URL)),
    },
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: {
        importScripts: ['/clear-api-cache.js', '/push-handler.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: false,
    }),
  ],
  build: {
    rollupOptions: {
      ...(command === 'build' ? { input } : {}),
    },
  },
}));
