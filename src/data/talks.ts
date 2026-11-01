/* ===========================================================================
   Talks section - the cards listed at /talks/, one per entry in
   src/content/talks.
   ========================================================================== */

import type { ImageMetadata } from 'astro';

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
