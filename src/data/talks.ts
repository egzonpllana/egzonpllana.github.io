/* ===========================================================================
   Talks section - the cards listed at /talks/.
   Entries backed by markdown live in src/content/talks and are picked up by
   the collection; anything with its own bespoke page is declared here.
   ========================================================================== */

import type { ImageMetadata } from 'astro';
import aiTodayCover from '../assets/covers/ai-today.png';
import { AI_TALK_META } from './aiTalk';

export interface TalkCardEntry {
  title: string;
  description: string;
  href: string;
  date: Date;
  /** Replaces the reading time for entries that are not prose. */
  meta: string;
  cta: string;
  image?: ImageMetadata;
}

export const TALKS_INTRO = {
  title: 'Talks',
  description:
    'Talks as I give them - the slides, the transcript of what I said on each one, and the write-up behind it.',
} as const;

/** The AI Today talk has its own slideshow page, so it is declared, not globbed. */
export const AI_TODAY_CARD: TalkCardEntry = {
  title: AI_TALK_META.title,
  description: AI_TALK_META.description,
  href: '/ai-today/',
  date: new Date('2026-07-07'),
  meta: 'Slides & transcript',
  cta: 'Watch the talk',
  image: aiTodayCover,
};
