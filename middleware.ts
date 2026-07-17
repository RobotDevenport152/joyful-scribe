import { next } from '@vercel/functions';

// Fixes broken social-share previews for product links WITHOUT an SSR
// rewrite. This is a client-only Vite/React SPA (see PROJECT_STATUS.md's
// platform audit) — index.html ships one static set of og:*/twitter:*
// tags for every URL, and per-page overrides (SEOHead) only apply after
// React hydrates. That's fine for crawlers that execute JS — Googlebot,
// Bingbot, and Applebot all do, so they already see SEOHead's correct
// per-page tags via a normal render and are deliberately NOT in the list
// below. The real gap is classic social-share unfurlers (Facebook,
// Twitter, LinkedIn, Slack, Discord, WhatsApp, Telegram, Pinterest,
// Reddit) — they fetch the URL once and read the raw HTML, never
// executing JS, so a shared /product/:id link has always shown the
// generic homepage card, never that product's name/photo/price.
//
// Because none of these crawlers execute JS, they don't need the real
// app shell (script tags, hashed asset bundle) at all — only correct
// <head> meta tags. So this builds a minimal, self-contained HTML
// response directly, rather than fetching the real index.html over the
// network: an earlier version did that (fetch(new URL('/', request.url)))
// and it silently failed in production — confirmed via runtime logs
// (mw: shell fetch status: 403) — because that self-fetch went back out
// through Cloudflare (this zone has Bot Fight Mode enabled, see
// infra/terraform/cloudflare.tf) and got treated as bot traffic, the same
// way the uptime-check workflow's GitHub Actions requests occasionally
// have been. Building the HTML directly sidesteps that failure mode
// entirely instead of working around it.
//
// Deliberately does NOT try to detect WeChat's link-preview crawler: there
// is no reliably documented, distinct user agent for it separate from
// "MicroMessenger", which is also what WeChat's real in-app browser sends
// for actual shoppers. Guessing wrong there would serve real WeChat
// customers this static, non-interactive HTML instead of the working
// storefront — a much worse outcome than the unsolved sharing problem.
// WeChat sharing still falls back to index.html's generic static tags,
// same as before this middleware existed.

export const config = {
  matcher: '/product/:path*',
};

const CRAWLER_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Pinterest|redditbot/i;

const SITE_ORIGIN = 'https://pacificalpaca.com';
const SUPABASE_URL = 'https://pymnquyxpoeqkkuzzial.supabase.co';
// Public anon key — safe to embed, it's already shipped in the client
// bundle (same reasoning as the Sentry DSN and the uptime-check workflow
// elsewhere in this repo).
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bW5xdXl4cG9lcWtrdXp6aWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDcyMzMsImV4cCI6MjA5MTE4MzIzM30.-q0rjRbjArN__-H6BPw9ZUHfb_BQSYBC2-fkYQSEBbc';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProductRow {
  id: string;
  slug: string;
  name_en: string;
  description_en: string | null;
  images: { url: string; is_primary?: boolean }[] | null;
}

async function fetchProduct(idOrSlug: string): Promise<ProductRow | null> {
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?${column}=eq.${encodeURIComponent(idOrSlug)}&select=id,slug,name_en,description_en,images&is_active=eq.true&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as ProductRow[];
  return rows[0] ?? null;
}

function toAbsoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A minimal, self-contained document — not the real app shell. Safe
// because every crawler this runs for reads only <head> and never
// executes JS (see the module comment above), so there's no hashed asset
// bundle to reference and nothing to go stale.
function buildCrawlerHtml(product: ProductRow, pageUrl: string): string {
  const title = `${product.name_en} | Pacific Alpacas`;
  const description = product.description_en || 'Premium 100% New Zealand alpaca fiber products from Pacific Alpacas.';
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const image = primaryImage ? toAbsoluteUrl(primaryImage.url) : `${SITE_ORIGIN}/images/hero-comforter.jpg`;

  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(pageUrl);
  const img = escapeHtml(image);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${u}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
</head>
<body>
<p><a href="${u}">${t}</a></p>
</body>
</html>`;
}

export default async function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_UA.test(ua)) return next();

  const url = new URL(request.url);
  const id = url.pathname.replace(/^\/product\//, '').split('/')[0];
  if (!id) return next();

  try {
    const product = await fetchProduct(id);
    if (!product) return next();

    const html = buildCrawlerHtml(product, request.url);

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Deliberately NOT shared/publicly cached. A shared cache (Vercel's
        // edge cache and Cloudflare in front of it both apply) keys by URL,
        // not by User-Agent, by default — an earlier version of this set a
        // shared max-age and it caused exactly the bug this comment is
        // warning against: a real user's plain request got cached, and
        // every subsequent crawler request to that same URL was served the
        // cached generic page instead of ever running this middleware
        // again. Crawler traffic on a boutique storefront is low-volume
        // enough that re-running this on every hit is cheap.
        'cache-control': 'private, no-store',
      },
    });
  } catch {
    // Never let a bug here take down a real page load — worst case a
    // crawler sees the generic default, same as before this existed.
    return next();
  }
}
