// Downloads App Store icons into src/assets/apps/.
// Run: node scripts/fetch-app-icons.mjs
//
// The iTunes lookup API caches artwork for a long time and can serve a stale
// icon for days after a new build ships, so the App Store product page is the
// primary source and the lookup API is only a fallback.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'assets', 'apps');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const APPS = [
  { slug: 'engramr', id: '1506049485' },
  { slug: 'first-principles-physics', id: '6800736839' },
  { slug: 'fish-care', id: '6760917397' },
  { slug: 'feed-my-dog', id: '6760208958' },
  { slug: 'read-habit', id: '6761147141' },
  { slug: 'walk-my-dog', id: '6760465177' },
];

/** Artwork advertised by the App Store product page (freshest source). */
async function artworkFromStorePage(id) {
  const res = await fetch(`https://apps.apple.com/us/app/id${id}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(
    /https:\/\/is\d-ssl\.mzstatic\.com\/image\/thumb\/[^"\s\\]+?\/AppIcon[^"\s\\]*?\/\d+x\d+[a-z]{2}\.(?:png|jpg|webp)/,
  );
  if (!match) return null;
  return match[0].replace(/\/\d+x\d+[a-z]{2}\.(?:png|jpg|webp)$/, '/512x512bb.jpg');
}

/** Artwork from the lookup API - cached, so only used when the page fails. */
async function artworkFromLookup(id) {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${id}&entity=software`,
  );
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return null;
  return (
    result.artworkUrl512 ||
    (result.artworkUrl100 || '').replace('100x100', '512x512') ||
    null
  );
}

await mkdir(OUT, { recursive: true });

for (const app of APPS) {
  const art =
    (await artworkFromStorePage(app.id)) || (await artworkFromLookup(app.id));
  if (!art) {
    console.error(`No artwork for ${app.slug} (${app.id})`);
    continue;
  }
  const img = await fetch(art, { headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await img.arrayBuffer());
  await writeFile(join(OUT, `${app.slug}.png`), buf);
  console.log(`Saved ${app.slug}.png (${buf.length} bytes)`);
}

console.log('Done.');
