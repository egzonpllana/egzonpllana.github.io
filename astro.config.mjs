// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/data/site';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'ignore',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [mdx(), sitemap()],
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
