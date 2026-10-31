/**
 * Inlines a built export page into one portable HTML file.
 *
 * Reads dist/export/<slug>/index.html, replaces every stylesheet link and
 * bundled script reference with its contents, and writes the result to
 * exports/<slug>.html. The output has no external requests: no CDN, no font
 * files, no site assets. Open it, mail it, or print it to PDF.
 *
 * Usage: node scripts/export-article.mjs <slug>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { inlineAssets } from './lib/inline-assets.mjs';

const slug = process.argv[2] ?? 'sdk-contracts-at-scale';
const root = process.cwd();
const built = path.join(root, 'dist', 'export', slug, 'index.html');
const outDir = path.join(root, 'exports');
const out = path.join(outDir, `${slug}.html`);

let html = await readFile(built, 'utf8');

const { html: inlined, unresolved } = await inlineAssets(
  html,
  path.join(root, 'dist'),
);
html = inlined;
if (unresolved.length > 0) {
  console.warn(`Unresolved site-absolute references: ${unresolved.join(', ')}`);
}

await mkdir(outDir, { recursive: true });
await writeFile(out, html, 'utf8');

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(
  `Wrote ${path.relative(root, out)} (${kb} KB, no external requests)`,
);
