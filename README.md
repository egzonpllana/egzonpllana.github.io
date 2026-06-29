# egzonpllana.com

Personal portfolio for Egzon Pllana — Senior iOS Engineer & SDK Architect. Built with [Astro](https://astro.build), static output, host-agnostic.

## Develop

```bash
nvm use          # Node 22 (see .nvmrc)
npm install
npm run dev      # http://localhost:4321
```

## Build

```bash
npm run build    # outputs static site to ./dist
npm run preview  # preview the production build
```

The `dist/` folder is a plain static site — deploy it to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host. No adapter or server required.

## Publishing an article

Add a Markdown (or MDX) file to `src/content/articles/`:

```markdown
---
title: 'Your title'
description: 'One-line summary used on cards and meta tags.'
date: 2026-06-29
tags: ['Swift', 'SDK Design']
draft: false
---

Your content…
```

The filename becomes the URL slug (`/articles/your-file-name`). The newest article auto-appears as the "latest" on the homepage; the rest are listed at `/articles`. Set `draft: true` to keep a file out of the build.

## Editing content

- **SDKs:** `src/data/sdks.ts` (star counts are a manual snapshot)
- **Apps:** `src/data/apps.ts` (`featured: true` surfaces on the homepage)
- **Profile / bio:** `src/data/profile.ts`
- **Site URL, nav, socials:** `src/data/site.ts` — set the production `url` here before deploying.

## App icons

App icons live in `public/apps/`. Refresh them with:

```bash
node scripts/fetch-app-icons.mjs
```
