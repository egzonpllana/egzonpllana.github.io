// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/data/site';

/**
 * Publish/update dates for every markdown collection, keyed `<section>/<slug>`
 * and read from frontmatter at config time, so the sitemap can carry <lastmod>
 * without loading the content collections.
 */
const CONTENT_DATES = (() => {
  const map = new Map();
  for (const section of ['articles', 'talks']) {
    const dir = `./src/content/${section}`;
    for (const file of readdirSync(dir)) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      const source = readFileSync(`${dir}/${file}`, 'utf8');
      const date = source.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      const updated = source.match(
        /^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m,
      )?.[1];
      const lastmod = updated ?? date;
      if (lastmod)
        map.set(`${section}/${file.replace(/\.(md|mdx)$/, '')}`, lastmod);
    }
  }
  return map;
})();

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const match = item.url.match(/\/(articles|talks)\/([^/]+)\/$/);
        const lastmod = match && CONTENT_DATES.get(`${match[1]}/${match[2]}`);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      // Dual themes: synced to the document's data-theme via CSS variables.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: false,
    },
  },
});
