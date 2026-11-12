import { certificateText, verifyUrl, type CertificateRecord } from './certificateText';

/**
 * Draws a certificate on an A4-landscape canvas (2480 × 1754, ~210 dpi):
 * PNG for one person, a print window (one page each) for many. No PDF
 * library: "Save as PDF" in the print dialog covers that.
 */

export type CertificateRow = CertificateRecord & { certificate_code: string };

export interface CertificateDesign {
  background_url: string;
  debate_background_url: string;
  signer_name: string;
  signer_title: string;
  signature_url: string;
  logo_url: string;
  site_url: string;
}

const W = 2480;
const H = 1754;
const FONT = 'Inter, system-ui, sans-serif';

const loadImage = (src: string) => new Promise<HTMLImageElement | null>(resolve => {
  if (!src) return resolve(null);
  const img = new Image();
  img.crossOrigin = 'anonymous'; // storage images must not taint the canvas, or it can't be saved
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

/** Largest font size ≤ max at which text fits maxWidth. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, maxWidth: number) {
  let size = max;
  do { ctx.font = `${weight} ${size}px ${FONT}`; } while (ctx.measureText(text).width > maxWidth && (size -= 2) > 20);
  return size;
}

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, weight: number, size: number, color: string, maxWidth = 1900) {
  fit(ctx, text, weight, size, maxWidth);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}

export async function renderCertificate(row: CertificateRow, design: CertificateDesign): Promise<HTMLCanvasElement> {
  const t = certificateText(row);
  const ink = t.isDebate ? '#013399' : '#0a1a30';
  const accent = t.isDebate ? '#800032' : '#b8901f';

  await Promise.all([700, 600, 400].map(w => document.fonts.load(`${w} 64px Inter`).catch(() => null)));
  const QRCode = (await import('qrcode')).default;
  const url = verifyUrl(design.site_url, row.certificate_code);
  const [background, logo, signature, qr] = await Promise.all([
    loadImage(t.isDebate ? design.debate_background_url : design.background_url),
    loadImage(design.logo_url),
    loadImage(design.signature_url),
    loadImage(await QRCode.toDataURL(url, { margin: 0, width: 300, errorCorrectionLevel: 'M', color: { dark: ink, light: '#ffffff00' } })),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';

  if (background) {
    ctx.drawImage(background, 0, 0, W, H);
  } else {
    // Built-in design: cream page, double frame, logo.
    ctx.fillStyle = '#fbf8f1';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 18;
    ctx.strokeRect(60, 60, W - 120, H - 120);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 100, W - 200, H - 200);
    if (logo) {
      // The site logo is white (made for dark backgrounds), so it sits on an ink disc.
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(W / 2, 285, 125, 0, Math.PI * 2);
      ctx.fill();
      const h = 170;
      const w = (logo.width / logo.height) * h;
      ctx.drawImage(logo, (W - w) / 2, 285 - h / 2, w, h);
    }
  }

  ctx.letterSpacing = '12px';
  centered(ctx, t.title.toUpperCase(), 520, 600, 64, accent);
  ctx.letterSpacing = '0px';
  centered(ctx, t.lead, 640, 400, 44, '#4b5563');
  centered(ctx, t.name, 810, 700, 124, ink);
  ctx.fillStyle = accent;
  ctx.fillRect(W / 2 - 300, 850, 600, 4);
  centered(ctx, t.body, 950, 400, 50, '#1f2937');
  centered(ctx, t.event, 1030, 400, 50, '#1f2937');
  if (t.award) centered(ctx, t.award, 1170, 700, 68, accent);

  // Signature block, bottom left.
  const sx = 560;
  if (signature) {
    const h = 150;
    const w = Math.min((signature.width / signature.height) * h, 520);
    ctx.drawImage(signature, sx - w / 2, 1330, w, h);
  }
  ctx.fillStyle = ink;
  ctx.fillRect(sx - 260, 1490, 520, 3);
  ctx.textAlign = 'center';
  if (design.signer_name) { ctx.font = `600 40px ${FONT}`; ctx.fillText(design.signer_name, sx, 1550); }
  if (design.signer_title) { ctx.font = `400 34px ${FONT}`; ctx.fillStyle = '#4b5563'; ctx.fillText(design.signer_title, sx, 1600); }

  // Verification, bottom right.
  const qx = W - 560;
  if (qr) ctx.drawImage(qr, qx - 130, 1270, 260, 260);
  ctx.fillStyle = '#4b5563';
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText(`No. ${row.certificate_code}`, qx, 1580);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillText(url.replace(/^https?:\/\//, ''), qx, 1622);

  return canvas;
}

const fileName = (row: CertificateRow) =>
  `TuronMUN certificate - ${row.full_name.trim()} - ${row.event}`.replace(/[\\/:*?"<>|]+/g, '-') + '.png';

export async function downloadCertificate(row: CertificateRow, design: CertificateDesign) {
  const canvas = await renderCertificate(row, design);
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not create the image');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName(row);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/**
 * Opens a print window with one certificate per A4-landscape page. Call
 * `openPrintWindow()` straight from the click (popup blockers), then this.
 */
export const openPrintWindow = () => window.open('', '_blank');

export async function printCertificates(win: Window, rows: CertificateRow[], design: CertificateDesign, onProgress?: (done: number) => void) {
  const doc = win.document;
  doc.title = 'TuronMUN certificates';
  doc.body.innerHTML = '<p style="font:16px system-ui;padding:24px">Preparing certificates…</p>';
  const pages: string[] = [];
  for (const [i, row] of rows.entries()) {
    const canvas = await renderCertificate(row, design);
    pages.push(canvas.toDataURL('image/jpeg', 0.92));
    onProgress?.(i + 1);
  }
  const style = doc.createElement('style');
  style.textContent = '@page{size:A4 landscape;margin:0}html,body{margin:0}img{display:block;width:100vw;height:auto;page-break-after:always}';
  doc.head.appendChild(style);
  doc.body.innerHTML = '';
  for (const src of pages) {
    const img = doc.createElement('img');
    img.src = src;
    doc.body.appendChild(img);
  }
  await Promise.all([...doc.images].map(img => img.decode().catch(() => null)));
  win.focus();
  win.print();
}
