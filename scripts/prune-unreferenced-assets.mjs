// Removes /_astro image files that no built file references.
// The content layer emits the original of every collection image alongside
// the optimized variants; the originals are never linked from any page.
// Run after `astro build`: node scripts/prune-unreferenced-assets.mjs
import { readdir, readFile, unlink, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const ASSETS = join(DIST, '_astro');
const IMAGE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
]);
const TEXT_EXTS = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.xml',
  '.txt',
  '.json',
]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const files = await walk(DIST);
const haystack = (
  await Promise.all(
    files
      .filter((f) => TEXT_EXTS.has(extname(f).toLowerCase()))
      .map((f) => readFile(f, 'utf8')),
  )
).join('\n');

let removed = 0;
let freed = 0;
for (const file of files) {
  if (!file.startsWith(ASSETS)) continue;
  if (!IMAGE_EXTS.has(extname(file).toLowerCase())) continue;
  const name = file.slice(ASSETS.length + 1);
  if (haystack.includes(name)) continue;
  freed += (await stat(file)).size;
  await unlink(file);
  removed++;
}

console.log(
  `pruned ${removed} unreferenced image(s), ${(freed / 1024).toFixed(0)} KiB`,
);
