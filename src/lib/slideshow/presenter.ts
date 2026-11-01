/**
 * Present mode for a deck: the deck fills the screen and every slide is laid
 * out on a fixed 16:9 frame, scaled to fit, the way presentation software
 * does it. Where the Fullscreen API is missing (iPhone Safari) or refused,
 * the deck covers the page inside the browser instead.
 *
 * In portrait (phone or tablet held upright) a 16:9 frame would be tiny, so
 * slides keep their responsive layout at full width and scroll when long.
 *
 * Markup contract (rendered by AiTalkSlideshow.astro), on top of Deck's:
 *   [data-deck-frame]           frame inside the stage that holds the slides
 *   [data-deck-present]         enter / exit toggle
 *   [data-deck-notes]           transcript toggle, shown while presenting
 */

import * as native from '../fullscreen/native';
import type { Deck } from './deck';

export enum PresentMode {
  Inline = 'inline',
  Presenting = 'presenting',
}

enum Strategy {
  /** Fullscreen API on the deck: browser chrome goes away too. */
  Native,
  /** Deck covers the page; browser chrome stays. */
  Immersive,
}

enum Orientation {
  Landscape = 'landscape',
  Portrait = 'portrait',
}

/** Frame width when the screen is at least this wide; it scales up from here. */
const FRAME_MAX_WIDTH = 1152;
/** Smallest frame width; narrower landscape screens scale this down. */
const FRAME_MIN_WIDTH = 960;
const FRAME_RATIO = 9 / 16;
/**
 * Below this stage height the letterbox is too thin for the floating
 * controls, so the frame is fitted above them instead of under them.
 */
const SHORT_STAGE_HEIGHT = 700;
/** Gap kept between the frame and the controls on short stages. */
const CONTROLS_GAP = 8;
/** Controls fade after this long without pointer activity. */
const IDLE_MS = 2500;

/** Remembers whether the viewer hid the transcript while presenting. */
const NOTES_STORAGE_KEY = 'deck:notes';

const PRESENTING_CLASS = 'is-presenting';
const IDLE_CLASS = 'is-idle';
const PAGE_LOCK_CLASS = 'deck-presenting';

const LABEL: Record<PresentMode, string> = {
  [PresentMode.Inline]: 'Present fullscreen',
  [PresentMode.Presenting]: 'Exit presentation',
};

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);

// Storage can be missing or throw (private mode, blocked site data); the
// transcript then simply starts shown.
function readNotesPreference(): boolean {
  try {
    return window.localStorage.getItem(NOTES_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writeNotesPreference(shown: boolean): void {
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, shown ? 'on' : 'off');
  } catch {
    /* preference is a convenience only */
  }
}

/**
 * Zoom that fits a slide's body into the frame height. The slide's padding,
 * its title and the backdrop drawn on the slide keep their size.
 */
function contentFit(slide: HTMLElement, frameHeight: number): number {
  const content = slide.querySelector<HTMLElement>('.deck-slide__content');
  const body = slide.querySelector<HTMLElement>('.deck-slide__body');
  if (!content || !body) return 1;
  const style = getComputedStyle(slide);
  const padding =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const bodyHeight = body.offsetHeight;
  const header = content.offsetHeight - bodyHeight;
  const available = frameHeight - padding - header;
  return bodyHeight > available && bodyHeight > 0 && available > 0
    ? available / bodyHeight
    : 1;
}

export class Presenter {
  private mode = PresentMode.Inline;
  private notesShown = readNotesPreference();
  private idleTimer = 0;
  private readonly frame: HTMLElement;
  private readonly presentButton: HTMLButtonElement | null;
  private readonly notesButton: HTMLButtonElement | null;
  private readonly controlsBar: HTMLElement | null;
  private readonly strategy = native.isSupported()
    ? Strategy.Native
    : Strategy.Immersive;

  constructor(
    private readonly deck: Deck,
    frame: HTMLElement,
  ) {
    const root = deck.root;
    this.frame = frame;
    this.presentButton = root.querySelector('[data-deck-present]');
    this.notesButton = root.querySelector('[data-deck-notes]');
    this.controlsBar = root.querySelector('.deck-controls__bar');

    this.presentButton?.addEventListener('click', () => void this.toggle());
    this.notesButton?.addEventListener('click', () => this.toggleNotes());
    native.onChange(() => this.onNativeChange());
    // Capture phase: runs before the deck's own arrow keys and before any
    // other page shortcut, which skip events already handled here.
    document.addEventListener('keydown', (event) => this.onKey(event), true);
    root.addEventListener('pointermove', () => this.wake(), { passive: true });
    root.addEventListener('pointerdown', () => this.wake(), { passive: true });
    new ResizeObserver(() => this.layout()).observe(deck.stage);
    void document.fonts?.ready.then(() => this.layout());

    this.render();
  }

  get isPresenting(): boolean {
    return this.mode === PresentMode.Presenting;
  }

  private async toggle(): Promise<void> {
    if (this.isPresenting) await this.exit();
    else await this.enter();
  }

  private async enter(): Promise<void> {
    if (this.strategy === Strategy.Native) {
      try {
        await native.request(this.deck.root);
        return; // onNativeChange applies the mode
      } catch {
        /* refused (policy, no gesture): fall back to immersive */
      }
    }
    this.apply(PresentMode.Presenting);
  }

  private async exit(): Promise<void> {
    if (native.currentElement() === this.deck.root) {
      try {
        await native.exit();
      } catch {
        /* already leaving */
      }
      return;
    }
    this.apply(PresentMode.Inline);
  }

  private onNativeChange(): void {
    const isOurs = native.currentElement() === this.deck.root;
    if (isOurs) this.apply(PresentMode.Presenting);
    else if (this.strategy === Strategy.Native && this.isPresenting)
      this.apply(PresentMode.Inline);
  }

  private apply(next: PresentMode): void {
    if (next === this.mode) return;
    this.mode = next;
    const isPresenting = next === PresentMode.Presenting;
    this.deck.root.classList.toggle(PRESENTING_CLASS, isPresenting);
    document.documentElement.classList.toggle(PAGE_LOCK_CLASS, isPresenting);
    this.render();
    this.layout();

    if (isPresenting) {
      this.deck.stage.focus({ preventScroll: true });
      this.wake();
    } else {
      window.clearTimeout(this.idleTimer);
      this.deck.root.classList.remove(IDLE_CLASS);
      this.presentButton?.focus({ preventScroll: true });
    }
  }

  private toggleNotes(): void {
    this.notesShown = !this.notesShown;
    writeNotesPreference(this.notesShown);
    this.render();
  }

  private render(): void {
    const root = this.deck.root;
    root.dataset.notes = this.notesShown ? 'on' : 'off';
    if (this.presentButton) {
      this.presentButton.dataset.mode = this.mode;
      this.presentButton.setAttribute(
        'aria-pressed',
        String(this.isPresenting),
      );
      this.presentButton.setAttribute('aria-label', LABEL[this.mode]);
      this.presentButton.title = `${LABEL[this.mode]} (F)`;
    }
    this.notesButton?.setAttribute('aria-pressed', String(this.notesShown));
  }

  // Lays the slides out on a fixed frame and scales it into the stage. Each
  // slide is measured at frame width; one taller than the frame is shrunk to
  // fit instead of spilling.
  private layout(): void {
    const slides = this.deck.allSlides;
    const root = this.deck.root;
    if (!this.isPresenting) {
      delete root.dataset.orient;
      this.frame.style.cssText = '';
      slides.forEach((slide) => slide.style.removeProperty('--slide-fit'));
      return;
    }

    const width = this.deck.stage.clientWidth;
    const height = this.deck.stage.clientHeight;
    if (width === 0 || height === 0) return;
    const orientation =
      width >= height ? Orientation.Landscape : Orientation.Portrait;
    root.dataset.orient = orientation;

    if (orientation === Orientation.Portrait) {
      this.frame.style.cssText = '';
      slides.forEach((slide) => slide.style.removeProperty('--slide-fit'));
      return;
    }

    const frameWidth = Math.max(
      FRAME_MIN_WIDTH,
      Math.min(FRAME_MAX_WIDTH, width),
    );
    const frameHeight = Math.round(frameWidth * FRAME_RATIO);
    const reserved = height < SHORT_STAGE_HEIGHT ? this.controlsReserve() : 0;
    const usableHeight = height - reserved;
    const fit = Math.min(width / frameWidth, usableHeight / frameHeight);
    this.frame.style.setProperty('--frame-top', usableHeight / 2 + 'px');
    this.frame.style.setProperty('--frame-w', frameWidth + 'px');
    this.frame.style.setProperty('--frame-h', frameHeight + 'px');
    this.frame.style.setProperty('--fit', String(fit));

    slides.forEach((slide) => slide.style.removeProperty('--slide-fit'));
    const fits = slides.map((slide) => contentFit(slide, frameHeight));
    slides.forEach((slide, i) => {
      const slideFit = fits[i] ?? 1;
      if (slideFit < 1)
        slide.style.setProperty('--slide-fit', String(slideFit));
    });
  }

  /** Height the floating controls cover, measured from the stage bottom. */
  private controlsReserve(): number {
    const bar = this.controlsBar;
    if (!bar) return 0;
    const stageBottom = this.deck.stage.getBoundingClientRect().bottom;
    const barTop = bar.getBoundingClientRect().top;
    return Math.max(0, stageBottom - barTop + CONTROLS_GAP);
  }

  private onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (native.isTypingTarget(event.target)) return;
    const key = event.key;

    if ((key === 'f' || key === 'F') && this.ownsFullscreenKey(event)) {
      event.preventDefault();
      void this.toggle();
      return;
    }
    if (!this.isPresenting) return;

    // Space and Enter on a focused control press that control.
    const onControl =
      event.target instanceof Element &&
      event.target.closest('button, a') !== null;
    if ((key === ' ' || key === 'Enter') && onControl) return;

    if (NEXT_KEYS.has(key)) this.deck.next();
    else if (PREV_KEYS.has(key)) this.deck.prev();
    else if (key === 'Home') this.deck.first();
    else if (key === 'End') this.deck.last();
    else if (key === 't' || key === 'T') this.toggleNotes();
    else if (key === 'Escape') void this.exit();
    else return;
    event.preventDefault();
  }

  // A page with a fullscreen reader shares F: the deck takes it only while
  // presenting or while focus is inside the deck.
  private ownsFullscreenKey(event: KeyboardEvent): boolean {
    if (this.isPresenting) return true;
    if (!document.querySelector('[data-fs-button]')) return true;
    return (
      event.target instanceof Node && this.deck.root.contains(event.target)
    );
  }

  private wake(): void {
    if (!this.isPresenting) return;
    this.deck.root.classList.remove(IDLE_CLASS);
    window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(
      () => this.deck.root.classList.add(IDLE_CLASS),
      IDLE_MS,
    );
  }
}
