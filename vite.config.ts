import path from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      output: {
        // Separa las librerías pesadas para que la carga inicial sea liviana.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor";
            }

            if (id.includes("@supabase") || id.includes("@tanstack")) {
              return "data";
            }

            if (id.includes("recharts")) {
              return "charts";
            }
          }
        },
      },
    },
  },
});
