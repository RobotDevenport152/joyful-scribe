import { describe, it, expect } from 'vitest';
import { isCertificateCodeFormat, buildVerifyUrl } from '@/lib/certificate';

describe('isCertificateCodeFormat', () => {
  it('accepts a well-formed certificate code', () => {
    expect(isCertificateCodeFormat('PA-CERT-1A2B3C4D5E6F7A8B9C')).toBe(true);
  });

  it('trims surrounding whitespace before matching', () => {
    expect(isCertificateCodeFormat('  PA-CERT-1A2B3C4D5E6F7A8B9C  ')).toBe(true);
  });

  it('rejects lowercase hex', () => {
    expect(isCertificateCodeFormat('PA-CERT-1a2b3c4d5e6f7a8b9c')).toBe(false);
  });

  it('rejects the legacy batch-code format', () => {
    expect(isCertificateCodeFormat('PA-2025-001')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isCertificateCodeFormat('')).toBe(false);
  });
});

describe('buildVerifyUrl', () => {
  it('builds a /verify/:code link from an origin and code', () => {
    expect(buildVerifyUrl('PA-CERT-1A2B3C4D5E6F7A8B9C', 'https://pacificalpacas.com'))
      .toBe('https://pacificalpacas.com/verify/PA-CERT-1A2B3C4D5E6F7A8B9C');
  });

  it('trims the code and URL-encodes special characters', () => {
    expect(buildVerifyUrl('  PA CERT/1  ', 'https://pacificalpacas.com'))
      .toBe('https://pacificalpacas.com/verify/PA%20CERT%2F1');
  });
});
