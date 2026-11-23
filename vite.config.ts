import { webcrypto } from 'node:crypto';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '考研英语一小作文背诵',
        short_name: '小作文',
        description: '基于 FSRS 间隔重复与学习科学的考研英语一小作文模板背诵工具',
        theme_color: '#F7F4EE',
        background_color: '#F7F4EE',
        display: 'standalone',
        icons: [
          {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='36' fill='%23FFFDF9' stroke='%23E6E0D6' stroke-width='6'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='116' font-weight='600' fill='%23A8862F'%3EL%3C/text%3E%3C/svg%3E",
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,svg}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
});
