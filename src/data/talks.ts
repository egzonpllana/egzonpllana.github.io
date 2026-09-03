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
    'Talks and long-form guides - the slides and transcripts of what I actually said, and the write-ups that stand on their own.',
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
