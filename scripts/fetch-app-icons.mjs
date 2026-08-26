// Downloads App Store icons into src/assets/apps/ via the iTunes lookup API.
// Run: node scripts/fetch-app-icons.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'assets', 'apps');

const APPS = [
  { slug: 'engramr', id: '1506049485' },
  { slug: 'first-principles-physics', id: '6800736839' },
  { slug: 'fish-care', id: '6760917397' },
  { slug: 'feed-my-dog', id: '6760208958' },
  { slug: 'read-habit', id: '6761147141' },
  { slug: 'walk-my-dog', id: '6760465177' },
];

await mkdir(OUT, { recursive: true });

for (const app of APPS) {
  const lookup = `https://itunes.apple.com/lookup?id=${app.id}&entity=software`;
  const res = await fetch(lookup);
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) {
    console.error(`No result for ${app.slug} (${app.id})`);
    continue;
  }
  const art =
    result.artworkUrl512 ||
    (result.artworkUrl100 || '').replace('100x100', '512x512');
  if (!art) {
    console.error(`No artwork for ${app.slug}`);
    continue;
  }
  const img = await fetch(art);
  const buf = Buffer.from(await img.arrayBuffer());
  await writeFile(join(OUT, `${app.slug}.png`), buf);
  console.log(`Saved ${app.slug}.png (${buf.length} bytes)`);
}

console.log('Done.');
