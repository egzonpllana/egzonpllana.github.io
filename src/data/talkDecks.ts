/* ===========================================================================
   Slide decks for the talks in src/content/talks, keyed by page slug. A talk
   page opens on its deck; the markdown write-up follows as the notes.
   ========================================================================== */

import { SLIDES as AI_TODAY_SLIDES } from './aiTalk';
import type { Slide } from './deck';
import { SDK_CONTRACTS_SLIDES } from './decks/sdk-contracts';
import { SENIOR_IOS_INTERVIEW_SLIDES } from './decks/senior-ios-interview';

const TALK_DECKS: Readonly<Record<string, Slide[]>> = {
  'ai-today': AI_TODAY_SLIDES,
  'sdk-contracts-at-scale': SDK_CONTRACTS_SLIDES,
  'senior-ios-interview-2026': SENIOR_IOS_INTERVIEW_SLIDES,
};

export function deckFor(slug: string): Slide[] | undefined {
  return TALK_DECKS[slug];
}
