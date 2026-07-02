import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

// Standard Vite configuration for TanStack Start/Router with relative base paths for Capacitor mobile
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  base: './', // 👈 Required for native mobile devices to resolve local asset links
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
