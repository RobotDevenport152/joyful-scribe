// Pre-generates WebP variants at a few widths for every product photo in
// public/images/. Free alternative to a runtime image CDN: every product
// image today is a static file bundled in this repo (confirmed by querying
// the live products table — none are Supabase Storage/R2 URLs), and there's
// no admin upload path that could add a remote one, so a build-time script
// covers the current catalog completely with no new recurring cost.
//
// Not wired into the CI build on purpose: these are static, rarely-changing
// assets, not something regenerated on every deploy. Re-run this manually
// (`npm run generate-image-variants`) after adding or replacing a photo in
// public/images/product-*.{jpg,jpeg,png}, then commit the generated .webp
// files alongside it.
//
// If an admin-facing image upload feature gets built later, this approach
// stops being sufficient on its own (it can't process images that don't
// exist at build time) — that's the point where a runtime service
// (Cloudflare Image Resizing, Supabase Storage transforms) actually earns
// its cost. See PROJECT_STATUS.md.

import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = join(process.cwd(), 'public', 'images');
const WIDTHS = [480, 800, 1200];
const WEBP_QUALITY = 80;

async function main() {
  const files = readdirSync(IMAGES_DIR).filter(
    (f) => f.startsWith('product-') && /\.(jpe?g|png)$/i.test(f)
  );

  console.log(`Found ${files.length} product photos in public/images/`);

  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = join(IMAGES_DIR, file);
    const ext = extname(file);
    const stem = basename(file, ext);
    const image = sharp(fullPath);
    const meta = await image.metadata();

    for (const width of WIDTHS) {
      // Never upscale — cap to the source image's actual width.
      const targetWidth = Math.min(width, meta.width);
      const outPath = join(IMAGES_DIR, `${stem}-${width}w.webp`);

      // Skip regenerating a variant whose source hasn't changed since it
      // was last built — keeps re-runs fast when only a few photos changed.
      try {
        const outStat = statSync(outPath);
        const srcStat = statSync(fullPath);
        if (outStat.mtimeMs > srcStat.mtimeMs) {
          skipped++;
          continue;
        }
      } catch {
        // outPath doesn't exist yet — fall through and generate it.
      }

      await sharp(fullPath)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
      generated++;
    }
  }

  console.log(`Generated ${generated} variants, skipped ${skipped} already up to date.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
