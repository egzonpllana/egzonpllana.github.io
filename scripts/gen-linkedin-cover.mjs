// Generates a LinkedIn cover banner (1584x396) promoting the portfolio.
// Output: ~/Downloads/egzonpllana-linkedin-cover.png
import sharp from 'sharp';
import { homedir } from 'node:os';
import { join } from 'node:path';

const W = 1584;
const H = 396;
const GREEN = '#2ee06a';

// Decorative orbital rings (echoes the site / OrbitCore motif), low-opacity, left side.
const rings = [70, 130, 190, 250]
  .map(
    (r, i) =>
      `<circle cx="250" cy="200" r="${r}" fill="none" stroke="${GREEN}" stroke-opacity="${0.16 - i * 0.03}" stroke-width="1.5"/>`
  )
  .join('');
const nodes = [
  [250, 10],
  [430, 200],
  [250, 390],
  [70, 200],
  [370, 90],
]
  .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4" fill="${GREEN}" fill-opacity="0.6"/>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0e0c"/>
      <stop offset="0.55" stop-color="#0b0e14"/>
      <stop offset="1" stop-color="#0d1512"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="22%" r="60%">
      <stop offset="0" stop-color="${GREEN}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- left orbital motif (partly behind the avatar zone) -->
  <g>${rings}${nodes}</g>

  <!-- EP mark, top safe area -->
  <rect x="430" y="56" width="46" height="46" rx="11" fill="${GREEN}"/>
  <text x="453" y="80" text-anchor="middle" dominant-baseline="central" font-family="'SF Mono','Menlo',monospace" font-size="20" font-weight="700" fill="#06140c">EP</text>
  <text x="492" y="80" dominant-baseline="central" font-family="'SF Mono','Menlo',monospace" font-size="16" letter-spacing="3" fill="${GREEN}">PORTFOLIO · NOW LIVE</text>

  <!-- main block -->
  <text x="430" y="186" font-family="'Helvetica Neue',Arial,sans-serif" font-size="74" font-weight="800" letter-spacing="-2" fill="#f1f5f3">Egzon Pllana</text>
  <text x="434" y="236" font-family="'Helvetica Neue',Arial,sans-serif" font-size="30" font-weight="600" fill="${GREEN}">Senior iOS Engineer · SDK &amp; Mobile Architect</text>

  <!-- mono stack line -->
  <text x="434" y="288" font-family="'SF Mono','Menlo',monospace" font-size="19" fill="#9aa6b8">Open-source Swift SDKs · iOS architecture · App Store apps</text>

  <!-- terminal-style url pill -->
  <g>
    <rect x="430" y="312" width="430" height="44" rx="10" fill="#0f1a14" stroke="${GREEN}" stroke-opacity="0.55"/>
    <text x="450" y="335" font-family="'SF Mono','Menlo',monospace" font-size="18" fill="${GREEN}">$ open </text>
    <text x="524" y="335" font-family="'SF Mono','Menlo',monospace" font-size="18" font-weight="700" fill="#f1f5f3">egzonpllana.github.io</text>
    <text x="822" y="335" font-family="'SF Mono','Menlo',monospace" font-size="18" fill="${GREEN}">↗</text>
  </g>
</svg>`;

const out = join(homedir(), 'Downloads', 'egzonpllana-linkedin-cover.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('saved', out);
