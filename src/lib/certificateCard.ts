import QRCode from 'qrcode';
import { buildVerifyUrl } from './certificate';

// Matches the site's actual CSS custom properties (src/index.css) so the
// printed card doesn't look like a random one-off design.
const COLOR = {
  background: 'hsl(40, 20%, 97%)',
  foreground: 'hsl(220, 20%, 10%)',
  muted: 'hsl(220, 10%, 40%)',
  gold: 'hsl(35, 60%, 50%)',
  border: 'hsl(35, 15%, 85%)',
};

export interface CertificateCardInput {
  code: string;
  productNameZh: string;
  productNameEn?: string | null;
  batchCode?: string | null;
  farmName?: string | null;
  region?: string | null;
  issuedAt?: string | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// A6 portrait at 300dpi (105mm x 148mm) — sized to be printed and folded
// into a physical certificate insert, not just a bare QR code.
const WIDTH = 1240;
const HEIGHT = 1748;

export async function generateCertificateCard(input: CertificateCardInput): Promise<string> {
  await document.fonts.load('600 60px "Cormorant Garamond"');
  await document.fonts.load('400 28px "Inter"');
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = COLOR.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decorative double border
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);
  ctx.strokeStyle = COLOR.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(64, 64, WIDTH - 128, HEIGHT - 128);

  // Logo
  try {
    const logo = await loadImage('/images/brand-logo-mark.jpg');
    const logoW = 480;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, (WIDTH - logoW) / 2, 130, logoW, logoH);
  } catch {
    // Falls back to text-only header if the logo can't be loaded (e.g. run
    // outside a browser context) — the card is still complete without it.
    ctx.fillStyle = COLOR.foreground;
    ctx.font = '600 44px "Cormorant Garamond"';
    ctx.textAlign = 'center';
    ctx.fillText('PACIFIC ALPACAS', WIDTH / 2, 200);
  }

  let y = 340;

  // Title
  ctx.fillStyle = COLOR.gold;
  ctx.font = '500 26px "Inter"';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('CERTIFICATE OF AUTHENTICITY', WIDTH / 2, y);
  ctx.letterSpacing = '0px';
  y += 44;
  ctx.font = '400 30px "Inter"';
  ctx.fillStyle = COLOR.muted;
  ctx.fillText('正品防伪证书', WIDTH / 2, y);
  y += 70;

  // Divider
  ctx.strokeStyle = COLOR.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, y);
  ctx.lineTo(WIDTH - 200, y);
  ctx.stroke();
  y += 70;

  // Product name
  ctx.fillStyle = COLOR.foreground;
  ctx.font = '600 52px "Cormorant Garamond"';
  ctx.fillText(input.productNameZh, WIDTH / 2, y);
  y += 50;
  if (input.productNameEn) {
    ctx.font = 'italic 400 30px "Cormorant Garamond"';
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(input.productNameEn, WIDTH / 2, y);
    y += 60;
  } else {
    y += 20;
  }

  // QR code
  const verifyUrl = buildVerifyUrl(input.code, window.location.origin);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 520, margin: 1 });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 460;
  ctx.drawImage(qrImg, (WIDTH - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 50;

  // Code text (for manual entry when a QR scanner isn't handy)
  ctx.fillStyle = COLOR.foreground;
  ctx.font = '600 34px "Inter"';
  ctx.letterSpacing = '2px';
  ctx.fillText(input.code, WIDTH / 2, y);
  ctx.letterSpacing = '0px';
  y += 36;
  ctx.font = '400 22px "Inter"';
  ctx.fillStyle = COLOR.muted;
  // Matches whatever host actually generated the QR above (verifyUrl) —
  // deliberately not hardcoded to pacificalpacas.com, since printing a URL
  // that doesn't match the QR's real target would make the card useless
  // until the domain cutover happens.
  ctx.fillText(
    verifyUrl.replace(/^https?:\/\//, ''),
    WIDTH / 2,
    y,
  );
  y += 70;

  // Traceability details, only if the product is linked to a fiber batch
  if (input.batchCode && input.farmName) {
    ctx.strokeStyle = COLOR.border;
    ctx.beginPath();
    ctx.moveTo(200, y);
    ctx.lineTo(WIDTH - 200, y);
    ctx.stroke();
    y += 60;

    ctx.font = '400 24px "Inter"';
    ctx.fillStyle = COLOR.muted;
    ctx.fillText('溯源批次 · Traceable Batch', WIDTH / 2, y);
    y += 44;
    ctx.font = '500 30px "Inter"';
    ctx.fillStyle = COLOR.foreground;
    ctx.fillText(
      `${input.batchCode}  ·  ${input.farmName}${input.region ? `  ·  ${input.region}` : ''}`,
      WIDTH / 2,
      y,
    );
    y += 70;
  }

  // Footer
  ctx.font = '400 22px "Inter"';
  ctx.fillStyle = COLOR.muted;
  ctx.fillText(
    input.issuedAt
      ? `Issued ${new Date(input.issuedAt).toLocaleDateString('en-NZ')}`
      : 'New Zealand Made · 100% Alpaca Fiber',
    WIDTH / 2,
    HEIGHT - 110,
  );

  return canvas.toDataURL('image/png');
}
