// Standalone random code generator for the physical certificate program —
// deliberately NOT wired into product_certificates or the /verify RPC yet.
// The brand's existing printed certificate (photographed 2026-07-18)
// references a different domain (pacificalpacas.com, plural — the legacy
// WordPress site, not the one this repo deploys) and a different code
// format (lowercase alphanumeric, no prefix) than this site's own
// generate_certificate_code() (see supabase/migrations/20260714120000_
// product_certificates.sql). Which domain/format the next print run
// actually uses is a brand decision, not resolved yet — see
// PROJECT_STATUS.md. This script only solves "give me N random,
// no-pattern codes now"; importing them into the database (and updating
// verify_certificate()/Verify.tsx if the format changes) is a separate
// step once that decision is made.
//
// Same entropy/alphabet choice as generate_certificate_code(): 9 random
// bytes -> 18 uppercase hex chars (~72 bits), no visually-ambiguous
// characters. Uses the same PA-CERT- prefix so these codes drop straight
// into product_certificates.code (unique, text) with no reformatting if
// the brand keeps this site's format.
//
// Usage:
//   node scripts/generate-certificate-codes.mjs [count]
//   node scripts/generate-certificate-codes.mjs 10000
//
// Output is a CSV written to certificate-codes-output/ (gitignored —
// NEVER commit generated codes to this repo, it's public on GitHub and
// committing them would let anyone read every future anti-counterfeit
// code before it's ever printed).

import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const COUNT = parseInt(process.argv[2] ?? '10000', 10);
const OUTPUT_DIR = join(process.cwd(), 'certificate-codes-output');

function generateCode() {
  return 'PA-CERT-' + randomBytes(9).toString('hex').toUpperCase();
}

function main() {
  if (!Number.isInteger(COUNT) || COUNT < 1) {
    console.error('Usage: node scripts/generate-certificate-codes.mjs [count]');
    process.exit(1);
  }

  const codes = new Set();
  while (codes.size < COUNT) {
    codes.add(generateCode());
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = join(OUTPUT_DIR, `certificate-codes-${COUNT}-${timestamp}.csv`);

  const csv = 'code\n' + [...codes].join('\n') + '\n';
  writeFileSync(outputPath, csv, 'utf8');

  console.log(`Generated ${codes.size} unique codes -> ${outputPath}`);
  console.log('Do NOT commit this file or any file under certificate-codes-output/ — this repo is public on GitHub.');
}

main();
