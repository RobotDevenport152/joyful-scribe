import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description?: string;
  image?: string;
}

// index.html ships static og:*/twitter:* defaults so non-JS-executing
// crawlers (classic Facebook/Twitter/WeChat link-preview bots — they never
// run JS, so they only ever see this raw HTML) still get something correct
// for the homepage. But react-helmet-async only dedupes tags against its
// OWN previously-rendered instances, not pre-existing static markup — so
// without this cleanup, every page using <SEOHead> ends up with two
// conflicting <meta property="og:title"> tags (the static one AND this
// component's), and per the Open Graph spec the first one wins in a
// conflict — meaning the wrong, generic one. This only removes the
// non-Helmet-owned duplicate (identified by the absence of Helmet's own
// `data-rh` marker) once this component's tags have actually landed, so
// JS-aware consumers (Googlebot, and an increasing number of link-preview
// services) see the correct per-page value. Pages that never render
// <SEOHead> at all are untouched — this only runs where it's needed.
const MANAGED_PROPERTY = ['og:title', 'og:description', 'og:image', 'og:type'];
const MANAGED_NAME = ['description', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

function removeStaleStaticTags() {
  for (const property of MANAGED_PROPERTY) {
    document.querySelectorAll(`meta[property="${property}"]:not([data-rh])`).forEach(el => el.remove());
  }
  for (const name of MANAGED_NAME) {
    document.querySelectorAll(`meta[name="${name}"]:not([data-rh])`).forEach(el => el.remove());
  }
}

export default function SEOHead({ title, description = '', image }: Props) {
  const fullTitle = `${title} | Pacific Alpacas — Luxury in Your Dreams`;
  // Previously fell back to /og-default.jpg, which was never a real file —
  // every page without an explicit `image` prop (all of them except product
  // pages) was shipping a 404'd og:image. Falls back to the same real,
  // on-brand asset index.html's own static default now uses.
  const ogImage = image || 'https://pacificalpaca.com/images/hero-comforter.jpg';

  useEffect(() => {
    // rAF, not a bare effect: needs to run after react-helmet-async's own
    // mount effect has committed its tags (so they carry the data-rh marker
    // this relies on to tell "static" from "ours" apart).
    const id = requestAnimationFrame(removeStaleStaticTags);
    return () => cancelAnimationFrame(id);
  }, [title, description, ogImage]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
