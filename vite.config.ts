import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        /**
         * Separa las librerías pesadas para que la carga inicial sea liviana y
         * el navegador pueda cachearlas entre despliegues. Desde Vite 8
         * `manualChunks` solo acepta función, no un objeto.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(recharts|d3-|victory-)/.test(id)) return 'charts';
          if (/node_modules\/(@supabase|@tanstack)\//.test(id)) return 'data';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id)) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
