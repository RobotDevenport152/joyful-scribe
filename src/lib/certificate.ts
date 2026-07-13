// Matches the format produced by generate_certificate_code() in
// supabase/migrations/20260714120000_product_certificates.sql
export const CERTIFICATE_CODE_PATTERN = /^PA-CERT-[0-9A-F]{18}$/;

export function isCertificateCodeFormat(code: string): boolean {
  return CERTIFICATE_CODE_PATTERN.test(code.trim());
}

export function buildVerifyUrl(code: string, origin: string): string {
  return `${origin}/verify/${encodeURIComponent(code.trim())}`;
}
