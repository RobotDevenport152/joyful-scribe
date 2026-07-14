import * as Sentry from '@sentry/react';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, event, ...context, ts: new Date().toISOString() };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
    // No-ops if Sentry.init() was never called (no VITE_SENTRY_DSN) — see lib/sentry.ts
    Sentry.captureMessage(event, { level: 'error', extra: context });
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
    Sentry.captureMessage(event, { level: 'warning', extra: context });
  } else {
    console.info(JSON.stringify(entry));
  }
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => log('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => log('error', event, context),
};
