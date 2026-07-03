import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const githubPagesBase = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';
const base = process.env.VITE_BASE_PATH || process.env.BASE_URL || (process.env.GITHUB_ACTIONS ? githubPagesBase : '/');

const githubPagesFallbackPlugin = () => ({
  name: 'github-pages-spa-fallback',
  closeBundle: async () => {
    const fs = await import('node:fs/promises');
    try {
      await fs.copyFile(path.resolve(__dirname, 'dist/index.html'), path.resolve(__dirname, 'dist/404.html'));
    } catch {
      // Ignore non-build contexts.
    }
  },
});

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    githubPagesFallbackPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      filename: 'sw.js',
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:js|css|woff2?)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'asset-cache' },
          },
        ],
      },
    }),
  ],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
