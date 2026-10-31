/**
 * Folds a built page's stylesheets and bundled scripts into the markup, so the
 * result renders from a file:// URL with no server and no external requests.
 *
 * Shared by the standalone article export and the figure rasteriser.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {string} html    contents of a built page
 * @param {string} distDir directory the site was built into
 * @returns {Promise<{ html: string, unresolved: string[] }>}
 */
export async function inlineAssets(html, distDir) {
  const read = (href) =>
    readFile(path.join(distDir, href.replace(/^\//, '')), 'utf8');

  for (const [tag] of [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)]) {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    if (!href || !href.startsWith('/')) continue;
    html = html.replace(tag, `<style>\n${await read(href)}\n</style>`);
  }

  for (const [tag, src] of [
    ...html.matchAll(/<script[^>]+src="(\/[^"]+)"[^>]*><\/script>/g),
  ]) {
    html = html.replace(
      tag,
      `<script type="module">\n${await read(src)}\n</script>`,
    );
  }

  const unresolved = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(
    (m) => m[1],
  );
  return { html, unresolved };
}
