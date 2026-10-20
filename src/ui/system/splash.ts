const MIN_VISIBLE_MS = 600;
const FADE_MS = 400;
const FAILSAFE_MS = 20_000;

let shown = 0;

// The loader only moves forward: models asked for later in the loading must not pull it back.
export function nextProgress(previous: number, finished: number, requested: number): number {
  if (requested <= 0) return previous;
  return Math.max(previous, Math.min(1, finished / requested));
}

function showProgress(ratio: number): void {
  const fill = document.getElementById('splash-loader-fill');
  if (fill) fill.style.transform = `scaleX(${ratio})`;
}

export function setSplashProgress(finished: number, requested: number): void {
  shown = nextProgress(shown, finished, requested);
  showProgress(shown);
}

export function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  showProgress(1);
  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now());
  setTimeout(() => {
    splash.classList.add('splash-hidden');
    setTimeout(() => splash.remove(), FADE_MS);
  }, remaining);
}

export function hideSplashAfterFailsafe(): void {
  setTimeout(hideSplash, FAILSAFE_MS);
}
