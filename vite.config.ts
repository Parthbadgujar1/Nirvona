import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Response headers the built app should always be served with. The same list
// is used by `vite preview` here and by scripts/serve.mjs / deploy/nginx.conf
// in production. CSP: scripts only from this origin (no inline/eval), styles
// may be inline (Tailwind/Radix set inline styles), fonts from Google Fonts,
// API calls only to our own backend, and the app may not be framed.
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

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
  preview: {
    port: 3000,
    headers: securityHeaders,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Nothing here targets browsers older than ~2021; a modern target means
    // less transpiled/polyfilled code.
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Put the big, rarely-changing libraries in their own files. A deploy
        // that only touches app code then leaves these cached in every
        // returning visitor's browser (they are content-hashed and served
        // `immutable`), so the second visit downloads only what changed.
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: "vendor-router", test: /node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/, priority: 25 },
            { name: "vendor-motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
});
