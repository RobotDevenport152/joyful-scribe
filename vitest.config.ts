import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Unit tests import modules that transitively import
    // `integrations/supabase/client.ts`, which calls createClient()
    // at module-load time. That throws without real env vars — but
    // no test in this suite talks to a real Supabase backend, so a
    // syntactically-valid placeholder is enough to let the module load.
    env: {
      VITE_SUPABASE_URL: "https://test-project.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      VITE_SUPABASE_PROJECT_ID: "test-project",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
