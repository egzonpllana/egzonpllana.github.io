import { Deck } from './deck';
import { Presenter } from './presenter';

/** Wires the talk deck and its present mode, if the page has one. */
export function startTalkDeck(): void {
  const root = document.querySelector<HTMLElement>('[data-ai-talk]');
  const stage = root?.querySelector<HTMLElement>('[data-ai-stage]');
  const frame = root?.querySelector<HTMLElement>('[data-ai-frame]');
  if (!root || !stage || !frame) return;

  let presenter: Presenter | null = null;
  const isMobile = window.matchMedia('(max-width: 640px)');
  const deck = new Deck(root, stage, {
    tapNavigates: () => isMobile.matches || presenter?.isPresenting === true,
  });
  if (deck.count === 0) return;
  presenter = new Presenter(deck, frame);
}
