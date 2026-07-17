const SITE_ORIGIN = 'https://pacificalpaca.com';

// Product photos and other assets are stored as relative paths for
// locally-hosted images (e.g. "/images/...") but social crawlers and
// schema.org structured data both require absolute URLs.
export function toAbsoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`;
}
