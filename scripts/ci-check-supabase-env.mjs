// Run in CI (and runnable locally) right after `vercel pull` + `npm run
// build`, before the Playwright suite: fails fast with a specific, obvious
// message if the pulled Vercel env vars don't actually work against
// Supabase, instead of letting Playwright time out downstream with a much
// less diagnosable error. Reads .env.local directly rather than relying on
// process.env, since Vite only inlines VITE_* vars at build time — by the
// time this script runs, the values only exist in the file, not the shell.
import { readFileSync } from 'node:fs';

const text = readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  // Vercel's pulled .env files sometimes quote values; strip a matching
  // pair of leading/trailing quotes if present.
  vars[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
}

const url = vars.VITE_SUPABASE_URL;
const key = vars.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('VITE_SUPABASE_URL present:', Boolean(url), url ? `(${url.length} chars)` : '');
console.log('VITE_SUPABASE_PUBLISHABLE_KEY present:', Boolean(key), key ? `(${key.length} chars)` : '');

if (!url || !key) {
  console.log(
    '::error::VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY missing from the pulled Vercel env — check they are actually set for this environment in the Vercel dashboard.'
  );
  process.exit(1);
}

try {
  const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log('Supabase response status:', res.status);
  if (!res.ok) {
    console.log('Body:', await res.text());
    console.log(
      '::error::Pulled Supabase credentials do not work against the real API — this is why the browser test has no products to click through.'
    );
    process.exit(1);
  }
} catch (e) {
  console.log(`::error::Fetch to Supabase failed entirely: ${e.message}`);
  process.exit(1);
}
