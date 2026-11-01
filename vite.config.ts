import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  optimizeDeps: { exclude: ["maplibre-gl"] },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/maplibre-gl/")) return "maplibre";
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/@radix-ui/")) return "ui-vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Override with DEV_API_PROXY in .env.local when port 3001 is taken.
      "/api": loadEnv(mode, process.cwd(), "DEV_API_PROXY").DEV_API_PROXY || "http://localhost:3001",
    },
  },
}));
