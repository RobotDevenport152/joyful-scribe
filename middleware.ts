import { next } from '@vercel/functions';

// Fixes broken social-share previews for product links WITHOUT an SSR
// rewrite. This is a client-only Vite/React SPA (see PROJECT_STATUS.md's
// platform audit) — index.html ships one static set of og:*/twitter:*
// tags for every URL, and per-page overrides (SEOHead) only apply after
// React hydrates. That's fine for crawlers that execute JS (Googlebot),
// but classic social-share unfurlers (Facebook, Twitter, LinkedIn, Slack,
// Discord, WhatsApp, Telegram) fetch the URL once and read the raw HTML —
// they never run JS, so a shared /product/:id link has always shown the
// generic homepage card, never that product's name/photo/price.
//
// This middleware intercepts ONLY requests from those known crawler user
// agents on /product/:id, fetches the real product server-side, and
// serves the same index.html with just the meta tags swapped — real users
// (including anyone on a normal browser or the real WeChat in-app browser)
// are never touched by this and get the exact same SPA as before.
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

const CRAWLER_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|bingbot|Applebot|Pinterest|redditbot/i;

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

function toAbsoluteUrl(url: string, origin: string): string {
  return url.startsWith('http') ? url : `${origin}${url}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function injectProductMeta(html: string, product: ProductRow, pageUrl: string, origin: string): string {
  const title = `${product.name_en} | Pacific Alpacas`;
  const description = product.description_en || 'Premium 100% New Zealand alpaca fiber products from Pacific Alpacas.';
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const image = primaryImage ? toAbsoluteUrl(primaryImage.url, origin) : `${origin}/images/hero-comforter.jpg`;

  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(pageUrl);
  const img = escapeHtml(image);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${d}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${t}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${t}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${d}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${d}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${img}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${img}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${u}">`);
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

    // Fetch the real built index.html from the origin — a plain GET to
    // "/" doesn't match this middleware's own matcher (scoped to
    // /product/:path*), so this can't recurse.
    const shellRes = await fetch(new URL('/', request.url));
    if (!shellRes.ok) return next();
    const shell = await shellRes.text();

    const html = injectProductMeta(shell, product, request.url, url.origin);

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Short edge cache: a popular shared product gets cached briefly
        // instead of re-fetching + re-templating on every crawl.
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch {
    // Never let a bug here take down a real page load — worst case a
    // crawler sees the generic default, same as before this existed.
    return next();
  }
}
