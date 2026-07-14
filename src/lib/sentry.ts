import * as Sentry from '@sentry/react';

// DSNs are not secrets — they're meant to be embedded in public client code,
// so hardcoding this as the default is safe. VITE_SENTRY_DSN still works as
// an override (e.g. pointing a fork at a different Sentry project) without
// requiring anyone to configure Vercel env vars just to get monitoring working.
const DEFAULT_DSN = 'https://ebc6ca69f84175174e889ded476508b5@o4511730959712256.ingest.us.sentry.io/4511730994380800';

export function initSentry() {
  // Skip in local dev / test runs so those don't burn the Sentry quota —
  // only real builds (production and Vercel preview deployments) report.
  if (!import.meta.env.PROD) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || DEFAULT_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
