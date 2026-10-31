// Cover, second style: an editorial poster on the submission yellow instead of
// the dark diagram card. Yellow ground, near-black ink, the four contracts as
// numbered rows down the right, a rule and a single line of standfirst.
import sharp from 'sharp';

const out = process.env.OUT;
if (!out) {
  console.error('usage: OUT=<path.png> node gen-cover-yellow.mjs');
  process.exit(1);
}

const sans = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'SF Mono', Menlo, Consolas, monospace";

const YELLOW = '#f5d74b';
const INK = '#14110a';
const INK_SOFT = '#4a422a';
const CARD = '#14110a';

const CONTRACTS = [
  'Thread safety is part of the API',
  'Never block the host’s threads',
  'The server holds the truth',
  'Defects ship as patch releases',
];

const rows = CONTRACTS.map((label, i) => {
  const y = 470 + i * 116;
  const n = String(i + 1).padStart(2, '0');
  return `
  <g>
    <rect x="1006" y="${y}" width="700" height="88" rx="14" fill="${CARD}"/>
    <text x="1046" y="${y + 56}" font-family="${mono}" font-size="30" font-weight="700" fill="${YELLOW}" letter-spacing="2">${n}</text>
    <line x1="1104" y1="${y + 24}" x2="1104" y2="${y + 64}" stroke="${YELLOW}" stroke-opacity="0.45" stroke-width="2"/>
    <text x="1132" y="${y + 56}" font-family="${sans}" font-size="30" font-weight="600" fill="#f4f1e6">${label}</text>
  </g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="${YELLOW}"/>

  <!-- ink band down the left edge, the only ornament -->
  <rect x="0" y="0" width="26" height="1080" fill="${INK}"/>

  <!-- eyebrow -->
  <text x="120" y="150" font-family="${mono}" font-size="26" font-weight="700" fill="${INK}" letter-spacing="12" xml:space="preserve">SDK · ENGINEERING · CONCURRENCY · SCALE</text>
  <line x1="120" y1="186" x2="1706" y2="186" stroke="${INK}" stroke-opacity="0.28" stroke-width="2"/>

  <!-- title -->
  <text x="120" y="330" font-family="${sans}" font-size="112" font-weight="800" fill="${INK}" letter-spacing="-4">Engineering an SDK</text>
  <text x="120" y="452" font-family="${sans}" font-size="112" font-weight="800" fill="${INK}" letter-spacing="-4">at scale</text>
  <rect x="124" y="486" width="352" height="12" fill="${INK}"/>

  <!-- standfirst, left column under the title -->
  <text x="120" y="580" font-family="${sans}" font-size="34" font-weight="600" fill="${INK}">Four contracts a library signs</text>
  <text x="120" y="626" font-family="${sans}" font-size="34" font-weight="600" fill="${INK}">when it runs inside a process</text>
  <text x="120" y="672" font-family="${sans}" font-size="34" font-weight="600" fill="${INK}">it does not own.</text>

  <!-- measured markers, left column -->
  <g font-family="${mono}" font-size="24" fill="${INK_SOFT}">
    <text x="120" y="782">measured, not repeated</text>
    <text x="120" y="826">workload stated with every number</text>
    <text x="120" y="870">130 tests · Swift 6.3</text>
  </g>

  <!-- the four contracts -->
  ${rows}

  <!-- footer rule -->
  <line x1="120" y1="960" x2="1706" y2="960" stroke="${INK}" stroke-opacity="0.28" stroke-width="2"/>
  <text x="120" y="1012" font-family="${mono}" font-size="24" font-weight="700" fill="${INK}" letter-spacing="4">FOUR CONTRACTS</text>
  <text x="1706" y="1012" text-anchor="end" font-family="${mono}" font-size="24" fill="${INK_SOFT}">thread safety · main thread · ordering · versioning</text>
</svg>`;

await sharp(Buffer.from(svg), { density: 144 })
  .resize(1920, 1080)
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log(`wrote ${out}`);
