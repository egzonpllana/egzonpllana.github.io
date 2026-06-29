// Generates apple-touch-icon, favicon.ico, and the default OG image.
// Run: node scripts/gen-assets.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
await mkdir(join(root, 'og'), { recursive: true });

const touch = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#0b0e14"/>
  <rect x="5" y="5" width="170" height="170" rx="35" fill="none" stroke="#2ee06a" stroke-opacity="0.55" stroke-width="5"/>
  <text x="88" y="94" text-anchor="middle" dominant-baseline="central"
    font-family="monospace" font-size="78" font-weight="700" fill="#2ee06a" letter-spacing="-3">EP</text>
  <rect x="123" y="112" width="26" height="8" rx="4" fill="#2ee06a"/>
</svg>`;
await sharp(Buffer.from(touch)).png().toFile(join(root, 'apple-touch-icon.png'));

const fav = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b0e14"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="#2ee06a" stroke-opacity="0.55" stroke-width="2"/>
  <text x="31" y="34" text-anchor="middle" dominant-baseline="central"
    font-family="monospace" font-size="28" font-weight="700" fill="#2ee06a" letter-spacing="-1">EP</text>
  <rect x="44" y="40" width="9" height="3" rx="1.5" fill="#2ee06a"/>
</svg>`;
await sharp(Buffer.from(fav)).resize(64, 64).png().toFile(join(root, 'favicon.ico'));

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0e14"/>
      <stop offset="1" stop-color="#121a2e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="80" width="64" height="64" rx="14" fill="#11a14e"/>
  <text x="112" y="124" text-anchor="middle" font-family="monospace" font-size="30" font-weight="700" fill="#fff" letter-spacing="-1">EP</text>
  <text x="80" y="330" font-family="sans-serif" font-size="76" font-weight="700" fill="#e8ecf3" letter-spacing="-2">Egzon Pllana</text>
  <text x="80" y="400" font-family="sans-serif" font-size="38" font-weight="500" fill="#2ee06a">Senior iOS Engineer · SDK &amp; Mobile Architect</text>
  <text x="80" y="470" font-family="monospace" font-size="26" fill="#9aa6b8">10+ years · Swift 6 · 10 open-source SDKs · App Store apps</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(join(root, 'og', 'default-og.png'));

console.log('assets generated');
