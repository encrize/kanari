import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'voices/*.opus', 'voices/*.m4a'],
      manifest: {
        name: 'kanari · Japanese kana, made simple',
        short_name: 'kanari',
        description: 'Learn Hiragana and Katakana through interactive practice, smart repetition and real-world vocabulary.',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><circle cx="96" cy="96" r="90" fill="%23f43f5e"/><text x="96" y="125" font-size="95" font-family="sans-serif" text-anchor="middle" fill="white" font-weight="900">カ</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="240" fill="%23f43f5e"/><text x="256" y="340" font-size="260" font-family="sans-serif" text-anchor="middle" fill="white" font-weight="900">カ</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/voices/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kana-audio-sprites',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
});
