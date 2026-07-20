export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  isRetryableStatus?: (status: number) => boolean;
}

const DEFAULT_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 4000;

function defaultIsRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Full jitter: random(0, min(maxDelay, base * 2^attempt)) -- avoids every
// concurrent invocation retrying in lockstep against an already-struggling API.
function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.random() * cap;
}

/**
 * fetch() with retry + exponential backoff for transient failures (network
 * errors, 429, 5xx). Edge functions call third-party APIs (Resend, Twilio,
 * Gemini, WeChat) synchronously in the request path, so a single dropped
 * connection used to mean a failed order email/SMS or chat reply with no
 * recovery. This gives those calls a few chances before the caller's own
 * fallback / best-effort handling kicks in.
 *
 * Request bodies must be re-sendable across attempts (string, URLSearchParams,
 * or undefined) -- none of this codebase's call sites use streaming bodies.
 */
export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options: RetryOptions = {},
): Promise<Response> {
  const {
    retries = DEFAULT_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    isRetryableStatus = defaultIsRetryableStatus,
  } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok || attempt === retries || !isRetryableStatus(response.status)) {
        return response;
      }
    } catch (err) {
      if (attempt === retries) throw err;
    }
    await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs));
  }
}
