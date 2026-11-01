/**
 * Thin wrapper over the Fullscreen API, including the prefixed WebKit
 * variant older Safari still ships. iPhone Safari has neither for regular
 * elements, so callers keep an in-page fallback for when `isSupported()`
 * is false or a request is refused.
 */

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

const doc = document as WebkitDocument;

export function isSupported(): boolean {
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export function currentElement(): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export async function request(element: HTMLElement): Promise<void> {
  const target = element as WebkitElement;
  if (target.requestFullscreen)
    await target.requestFullscreen({ navigationUI: 'hide' });
  else if (target.webkitRequestFullscreen)
    await target.webkitRequestFullscreen();
  else throw new Error('Fullscreen API unavailable');
}

export async function exit(): Promise<void> {
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else await doc.webkitExitFullscreen?.();
}

export function onChange(handler: () => void): void {
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
}

/** Keys typed into a field belong to the field, not to a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}
