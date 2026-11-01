/**
 * Slide navigation for a talk deck: one active slide, a counter, a progress
 * bar and the transcript of the active slide.
 *
 * Markup contract (rendered by AiTalkSlideshow.astro):
 *   [data-deck]            root
 *   [data-deck-stage]           focusable stage holding the slides
 *   .deck-slide                 one per slide, carries data-transcript
 *   [data-deck-prev|next]       buttons
 *   [data-deck-counter]         "01 / 17"
 *   [data-deck-fill]            progress bar fill
 *   [data-deck-transcript]      transcript text of the active slide
 */

const SWIPE_PX = 50;
const TAP_PX = 10;

export interface DeckOptions {
  /** Taps on the stage change slides: left third back, the rest forward. */
  tapNavigates: () => boolean;
}

const pad = (n: number): string => (n < 10 ? '0' + n : String(n));

/** Touches that start here scroll, select or activate instead of navigating. */
function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('.deck-code, .deck-code-wrap, pre, a, button') !== null
  );
}

export class Deck {
  readonly stage: HTMLElement;
  private readonly slides: HTMLElement[];
  private readonly prevButton: HTMLButtonElement | null;
  private readonly nextButton: HTMLButtonElement | null;
  private readonly counter: HTMLElement | null;
  private readonly fill: HTMLElement | null;
  private readonly transcript: HTMLElement | null;
  private readonly reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private current = -1;

  constructor(
    readonly root: HTMLElement,
    stage: HTMLElement,
    private readonly options: DeckOptions,
  ) {
    this.stage = stage;
    this.slides = Array.from(stage.querySelectorAll<HTMLElement>('.deck-slide'));
    this.prevButton = root.querySelector('[data-deck-prev]');
    this.nextButton = root.querySelector('[data-deck-next]');
    this.counter = root.querySelector('[data-deck-counter]');
    this.fill = root.querySelector('[data-deck-fill]');
    this.transcript = root.querySelector('[data-deck-transcript]');

    this.prevButton?.addEventListener('click', () => this.prev());
    this.nextButton?.addEventListener('click', () => this.next());
    root.addEventListener('keydown', (event) => this.onKey(event));
    this.bindTouch();
    this.go(0);
  }

  get count(): number {
    return this.slides.length;
  }

  get allSlides(): readonly HTMLElement[] {
    return this.slides;
  }

  next(): void {
    this.go(this.current + 1);
  }

  prev(): void {
    this.go(this.current - 1);
  }

  first(): void {
    this.go(0);
  }

  last(): void {
    this.go(this.count - 1);
  }

  go(index: number): void {
    const target = Math.max(0, Math.min(this.count - 1, index));
    if (target === this.current) return;
    this.current = target;

    this.slides.forEach((slide, i) => {
      const isActive = i === target;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    if (this.fill)
      this.fill.style.width = ((target + 1) / this.count) * 100 + '%';
    if (this.counter)
      this.counter.innerHTML =
        '<b>' + pad(target + 1) + '</b> / ' + pad(this.count);
    if (this.prevButton) this.prevButton.disabled = target === 0;
    if (this.nextButton) this.nextButton.disabled = target === this.count - 1;
    this.renderTranscript();
  }

  private renderTranscript(): void {
    const text = this.transcript;
    if (!text) return;
    text.textContent = this.slides[this.current]?.dataset.transcript ?? '';
    if (this.reduceMotion) return;
    text.classList.remove('swap-in');
    void text.offsetWidth; // force reflow to replay the animation
    text.classList.add('swap-in');
  }

  // Only while focus is inside the deck, so page-level arrow-key scrolling
  // and other widgets are never hijacked.
  private onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('a, input, textarea, select')
    )
      return;
    event.preventDefault();
    if (event.key === 'ArrowRight') this.next();
    else this.prev();
  }

  // Swipe left/right anywhere; Stories-style tap zones where enabled.
  private bindTouch(): void {
    let startX: number | null = null;
    let startY = 0;
    let skip = false;

    this.stage.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        startX = touch.clientX;
        startY = touch.clientY;
        skip = isInteractive(event.target);
      },
      { passive: true },
    );
    this.stage.addEventListener(
      'touchend',
      (event) => {
        const touch = event.changedTouches[0];
        if (startX === null || !touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const wasSkip = skip;
        startX = null;
        skip = false;
        if (wasSkip) return;
        if (Math.abs(dx) > SWIPE_PX) {
          if (dx < 0) this.next();
          else this.prev();
          return;
        }
        const isTap = Math.abs(dx) < TAP_PX && Math.abs(dy) < TAP_PX;
        if (!isTap || !this.options.tapNavigates()) return;
        const rect = this.stage.getBoundingClientRect();
        if (touch.clientX - rect.left < rect.width / 3) this.prev();
        else this.next();
      },
      { passive: true },
    );
  }
}
