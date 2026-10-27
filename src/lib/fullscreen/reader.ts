/**
 * Fullscreen reading mode for a page, driven by one floating button.
 *
 * Where the browser supports the Fullscreen API, the whole document goes
 * fullscreen (not a single element), so the page keeps its own scroll, anchors
 * and figure observers. Where it does not (iPhone Safari), or the request is
 * refused, the page falls back to an immersive mode inside the browser. Both
 * put `is-fullscreen` on the root, which hides `[data-fullscreen-hide]` (site
 * header and footer).
 *
 * Markup contract (rendered by FullscreenButton.astro):
 *   [data-fs-button]        the toggle; carries data-mode="page" | "fullscreen"
 *   [data-fs-track="sel"]   on the button: element the reader is reading
 */

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export enum ScreenMode {
  Page = 'page',
  Fullscreen = 'fullscreen',
}

enum Strategy {
  /** Fullscreen API: browser chrome goes away too. */
  Native,
  /** In-page only: header and footer go away, browser chrome stays. */
  Immersive,
}

const FULLSCREEN_CLASS = 'is-fullscreen';
/** Button fades back after this long without pointer activity. */
const IDLE_MS = 2500;
/**
 * In page mode the button shows while the track spans this line of the
 * viewport (fraction of its height): in once reading has started, out before
 * the closing links so it never sits on top of them.
 */
const READING_LINE = 0.5;

const LABEL: Record<ScreenMode, string> = {
  [ScreenMode.Page]: 'Enter fullscreen',
  [ScreenMode.Fullscreen]: 'Exit fullscreen',
};

const doc = document as WebkitDocument;
const root = document.documentElement as WebkitElement;

function nativeSupported(): boolean {
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

function nativeActive(): boolean {
  return (
    (doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null) === root
  );
}

async function requestNative(): Promise<void> {
  if (root.requestFullscreen)
    await root.requestFullscreen({ navigationUI: 'hide' });
  else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
  else throw new Error('Fullscreen API unavailable');
}

async function exitNative(): Promise<void> {
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else await doc.webkitExitFullscreen?.();
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

class FullscreenReader {
  private mode = ScreenMode.Page;
  private idleTimer = 0;
  private frame = 0;

  constructor(
    private readonly button: HTMLButtonElement,
    private readonly track: HTMLElement,
    private readonly strategy: Strategy,
  ) {
    button.addEventListener('click', () => void this.switchMode());
    document.addEventListener('fullscreenchange', () => this.onNativeChange());
    document.addEventListener('webkitfullscreenchange', () =>
      this.onNativeChange(),
    );
    document.addEventListener('keydown', (event) => this.onKey(event));
    window.addEventListener('scroll', () => this.scheduleUpdate(), {
      passive: true,
    });
    window.addEventListener('resize', () => this.scheduleUpdate(), {
      passive: true,
    });
    window.addEventListener('pointermove', () => this.wake(), {
      passive: true,
    });
    window.addEventListener('pointerdown', () => this.wake(), {
      passive: true,
    });

    this.render();
    this.update();
  }

  private async switchMode(): Promise<void> {
    if (this.mode === ScreenMode.Fullscreen) await this.exit();
    else await this.enter();
  }

  private async enter(): Promise<void> {
    if (this.strategy === Strategy.Native) {
      try {
        await requestNative();
        return; // onNativeChange applies the mode
      } catch {
        /* refused (policy, no gesture): fall back to immersive */
      }
    }
    this.apply(ScreenMode.Fullscreen);
  }

  private async exit(): Promise<void> {
    if (nativeActive()) {
      try {
        await exitNative();
      } catch {
        /* already leaving */
      }
      return;
    }
    this.apply(ScreenMode.Page);
  }

  private onNativeChange(): void {
    this.apply(nativeActive() ? ScreenMode.Fullscreen : ScreenMode.Page);
  }

  private onKey(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      void this.switchMode();
    } else if (event.key === 'Escape' && this.mode === ScreenMode.Fullscreen) {
      // Native fullscreen handles Escape itself; immersive needs it here.
      void this.exit();
    }
  }

  // Hiding the header shifts the article; measure the track before and after
  // so the line being read stays put. A browser that already anchored the
  // scroll reports no shift, so this never double-corrects.
  private apply(next: ScreenMode): void {
    if (next === this.mode) return;
    const before = this.track.getBoundingClientRect().top;
    this.mode = next;
    root.classList.toggle(FULLSCREEN_CLASS, next === ScreenMode.Fullscreen);
    this.render();

    requestAnimationFrame(() => {
      const shift = this.track.getBoundingClientRect().top - before;
      if (shift !== 0) window.scrollBy(0, shift);
      this.update();
      this.wake();
    });
  }

  private render(): void {
    const isFullscreen = this.mode === ScreenMode.Fullscreen;
    this.button.dataset.mode = this.mode;
    this.button.setAttribute('aria-pressed', String(isFullscreen));
    this.button.setAttribute('aria-label', LABEL[this.mode]);
    this.button.title = `${LABEL[this.mode]} (F)`;
  }

  private scheduleUpdate(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }

  private update(): void {
    const rect = this.track.getBoundingClientRect();
    const line = window.innerHeight * READING_LINE;
    const isReading = rect.top < line && rect.bottom > line;
    const wasShown = this.button.classList.contains('is-shown');
    this.button.classList.toggle('is-shown', isReading);
    if (isReading && !wasShown) this.wake();
  }

  private wake(): void {
    this.button.classList.remove('is-idle');
    window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(
      () => this.button.classList.add('is-idle'),
      IDLE_MS,
    );
  }
}

/** Wires the fullscreen button, if the page has one. */
export function startFullscreenReader(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-fs-button]');
  if (!button) return;

  const selector = button.dataset.fsTrack;
  const track =
    (selector && document.querySelector<HTMLElement>(selector)) ||
    document.body;
  const strategy = nativeSupported() ? Strategy.Native : Strategy.Immersive;
  new FullscreenReader(button, track, strategy);
}
