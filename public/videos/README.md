# public/videos/

`.gitignore` blocks `*.mp4` globally to keep large/random video dumps out of the repo, with a narrow exception for `public/videos/*.mp4`. Only small (<10MB), production-ready, web-optimized videos belong here — anything larger should be hosted externally (Supabase Storage / CDN) and referenced by URL instead of committed.

- `promo.mp4` — hero background loop (H.264, muted, ~7MB), sourced from the brand's official promo footage.
