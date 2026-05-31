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
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => log('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => log('error', event, context),
};
