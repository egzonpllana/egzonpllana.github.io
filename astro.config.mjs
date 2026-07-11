// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/data/site';

/**
 * Article publish/update dates by slug, read from frontmatter at config time
 * so the sitemap can carry <lastmod> without loading the content collection.
 */
const ARTICLE_DATES = (() => {
  const dir = './src/content/articles';
  const map = new Map();
  for (const file of readdirSync(dir)) {
    if (!/\.(md|mdx)$/.test(file)) continue;
    const source = readFileSync(`${dir}/${file}`, 'utf8');
    const date = source.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
    const updated = source.match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
    const lastmod = updated ?? date;
    if (lastmod) map.set(file.replace(/\.(md|mdx)$/, ''), lastmod);
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
        const slug = item.url.match(/\/articles\/([^/]+)\/$/)?.[1];
        const lastmod = slug && ARTICLE_DATES.get(slug);
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
