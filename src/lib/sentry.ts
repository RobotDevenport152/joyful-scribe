import * as Sentry from '@sentry/react';

// No-ops entirely until VITE_SENTRY_DSN is set — safe to call in every
// environment (local dev, CI, preview) without an account being configured yet.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
