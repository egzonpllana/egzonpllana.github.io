import { Deck } from './deck';
import { Presenter } from './presenter';

/** Wires the talk deck and its present mode, if the page has one. */
export function startTalkDeck(): void {
  const root = document.querySelector<HTMLElement>('[data-deck]');
  const stage = root?.querySelector<HTMLElement>('[data-deck-stage]');
  const frame = root?.querySelector<HTMLElement>('[data-deck-frame]');
  if (!root || !stage || !frame) return;

  let presenter: Presenter | null = null;
  const isMobile = window.matchMedia('(max-width: 640px)');
  const deck = new Deck(root, stage, {
    tapNavigates: () => isMobile.matches || presenter?.isPresenting === true,
  });
  if (deck.count === 0) return;
  presenter = new Presenter(deck, frame);
}
