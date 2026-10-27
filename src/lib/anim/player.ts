/**
 * Playback runtime for animated figures.
 *
 * A figure owns its engine (timers, frames, CSS classes); this runtime owns
 * everything around it: the play / pause / restart controls, autoplay the
 * first time the figure scrolls into view, pausing while it is off screen,
 * and the state every control reflects. Nothing loops: the engine reports its
 * last frame and the figure rests there until the reader replays it.
 *
 * Figure scripts stay inline (several use define:vars), so they register
 * through a queue that works whether or not this module has loaded yet:
 *
 *   (window.animQueue = window.animQueue || []).push({
 *     root,   // element that contains <AnimControls />
 *     play,   // start, or resume from the current frame
 *     pause,  // freeze on the current frame
 *     reset,  // back to the first frame, stopped
 *   });
 *
 * and report back with events dispatched on `root`:
 *
 *   anim:ended    the last frame is on screen
 *   anim:paused   the engine stopped itself (e.g. a manual step button)
 *   anim:started  the engine started itself (e.g. a mode switch that replays)
 */

export interface AnimEngine {
  root: HTMLElement;
  play(): void;
  pause(): void;
  reset(): void;
}

interface AnimRegistry {
  push(...engines: AnimEngine[]): number;
}

declare global {
  interface Window {
    animQueue?: AnimEngine[] | AnimRegistry;
  }
}

export enum AnimState {
  /** Registered, not started yet (waiting to scroll into view). */
  Idle = 'idle',
  Playing = 'playing',
  Paused = 'paused',
  /** Resting on the last frame. */
  Ended = 'ended',
}

enum PauseReason {
  User,
  Offscreen,
}

export enum AnimEvent {
  Ended = 'anim:ended',
  Paused = 'anim:paused',
  Started = 'anim:started',
}

const TOGGLE_LABEL: Record<AnimState, string> = {
  [AnimState.Idle]: 'Play animation',
  [AnimState.Playing]: 'Pause animation',
  [AnimState.Paused]: 'Resume animation',
  [AnimState.Ended]: 'Replay animation',
};

/** A figure counts as on screen once it reaches the middle band of the viewport. */
const VIEWPORT_BAND = '-10% 0px -20% 0px';

class AnimPlayer {
  private state = AnimState.Idle;
  private pauseReason: PauseReason | null = null;
  private hasAutoplayed = false;
  private readonly controls: HTMLElement[];
  private readonly toggles: HTMLButtonElement[];

  constructor(
    private readonly engine: AnimEngine,
    private readonly reducedMotion: boolean,
  ) {
    const { root } = engine;
    this.controls = [
      ...root.querySelectorAll<HTMLElement>('[data-anim-controls]'),
    ];
    this.toggles = [
      ...root.querySelectorAll<HTMLButtonElement>('[data-anim-toggle]'),
    ];

    this.toggles.forEach((button) =>
      button.addEventListener('click', () => this.toggle()),
    );
    root
      .querySelectorAll<HTMLButtonElement>('[data-anim-reset]')
      .forEach((button) =>
        button.addEventListener('click', () => this.restart()),
      );

    root.addEventListener(AnimEvent.Ended, () => {
      this.pauseReason = null;
      this.render(AnimState.Ended);
    });
    root.addEventListener(AnimEvent.Paused, () => {
      this.pauseReason = PauseReason.User;
      this.render(AnimState.Paused);
    });
    root.addEventListener(AnimEvent.Started, () => {
      this.hasAutoplayed = true;
      this.pauseReason = null;
      this.render(AnimState.Playing);
    });

    this.render(AnimState.Idle);
  }

  setVisible(visible: boolean): void {
    if (!visible) {
      if (this.state === AnimState.Playing) this.pause(PauseReason.Offscreen);
      return;
    }
    if (this.state === AnimState.Idle) {
      if (!this.hasAutoplayed && !this.reducedMotion) this.restart();
      return;
    }
    if (
      this.state === AnimState.Paused &&
      this.pauseReason === PauseReason.Offscreen
    ) {
      this.play();
    }
  }

  private toggle(): void {
    switch (this.state) {
      case AnimState.Playing:
        this.pause(PauseReason.User);
        break;
      case AnimState.Paused:
        this.play();
        break;
      case AnimState.Idle:
      case AnimState.Ended:
        this.restart();
        break;
    }
  }

  // State is rendered before the engine runs, so an engine that reports
  // anim:ended synchronously from play() is not overwritten afterwards.
  private play(): void {
    this.pauseReason = null;
    this.render(AnimState.Playing);
    this.engine.play();
  }

  private pause(reason: PauseReason): void {
    this.pauseReason = reason;
    this.render(AnimState.Paused);
    this.engine.pause();
  }

  private restart(): void {
    this.hasAutoplayed = true;
    this.engine.reset();
    this.play();
  }

  private render(state: AnimState): void {
    this.state = state;
    this.engine.root.dataset.animState = state;
    this.controls.forEach((control) => (control.dataset.state = state));
    this.toggles.forEach((button) =>
      button.setAttribute('aria-label', TOGGLE_LABEL[state]),
    );
  }
}

/** Installs the registry once per page and adopts figures queued before it. */
export function startAnimRuntime(): void {
  const queued = window.animQueue;
  if (queued && !Array.isArray(queued)) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const players = new Map<Element, AnimPlayer>();
  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) =>
              players.get(entry.target)?.setVisible(entry.isIntersecting),
            ),
          { rootMargin: VIEWPORT_BAND, threshold: 0 },
        )
      : null;

  const register = (engine: AnimEngine): void => {
    if (players.has(engine.root)) return;
    const player = new AnimPlayer(engine, reducedMotion);
    players.set(engine.root, player);
    if (observer) observer.observe(engine.root);
    else player.setVisible(true);
  };

  window.animQueue = {
    push(...engines: AnimEngine[]): number {
      engines.forEach(register);
      return players.size;
    },
  };
  (queued ?? []).forEach(register);
}
