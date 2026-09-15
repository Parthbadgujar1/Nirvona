import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vite/React Router SPA config, replacing Next.js. Kept deliberately
// small: no SSR, no server-only build step - the whole app is a static
// bundle served by the PHP host (or `vite preview` locally), with the
// PHP backend as the only server-side component.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
