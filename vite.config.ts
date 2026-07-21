import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, slow-changing vendor libs into their own cacheable chunks
        // so a routine app-code deploy doesn't force browsers to re-download and
        // re-parse React/Supabase/etc — main entry chunk was 897kB (over the
        // 500kB warning threshold) with everything bundled together.
        //
        // Function form, not the old object-map form: Rolldown (Vite 8's default
        // bundler) only accepts manualChunks as a function — the object form
        // that Rollup (Vite <=7) supported throws `manualChunks is not a
        // function` at build time.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return "vendor-react";
          if (id.includes("node_modules/@supabase/supabase-js") || id.includes("node_modules\\@supabase\\supabase-js")) return "vendor-supabase";
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) return "vendor-motion";
          if (/[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/.test(id)) return "vendor-query";
          if (/[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/.test(id)) return "vendor-i18n";
          if (/[\\/]node_modules[\\/]@radix-ui[\\/]react-(dialog|dropdown-menu|tabs|tooltip|select|toast)[\\/]/.test(id)) return "vendor-radix";
        },
      },
    },
  },
}));
