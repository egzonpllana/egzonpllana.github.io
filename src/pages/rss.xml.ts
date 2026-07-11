import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../data/site';
import { articleSlug } from '../lib/slug';

export async function GET(context: APIContext) {
  const articles = (await getCollection('articles')).filter(
    (a) => !a.data.draft,
  );
  articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const site = context.site ?? SITE.url;
  const selfUrl = new URL('rss.xml', site).toString();

  return rss({
    title: `${SITE.name} - Articles`,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.date,
      link: `/articles/${articleSlug(article.id)}/`,
      categories: article.data.tags,
      author: `${SITE.email} (${SITE.author})`,
    })),
    customData: `<language>en-us</language><atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>`,
  });
}
