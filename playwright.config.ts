import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

// Vercel preview deployments sit behind deployment protection (a Vercel login wall) unless
// this header is present, so the "preview smoke test" CI job — which points Playwright at the
// real Vercel preview URL — would otherwise never see the actual app, just the login page.
// The production smoke test job doesn't need this: it serves a locally-built copy via
// `vite preview`, which has no Vercel protection in front of it.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    ...(bypassSecret ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret } } : {}),
  },
});
