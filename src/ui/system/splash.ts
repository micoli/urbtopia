const MIN_VISIBLE_MS = 600;
const FADE_MS = 400;
const FAILSAFE_MS = 20_000;

export function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now());
  setTimeout(() => {
    splash.classList.add('splash-hidden');
    setTimeout(() => splash.remove(), FADE_MS);
  }, remaining);
}

export function hideSplashAfterFailsafe(): void {
  setTimeout(hideSplash, FAILSAFE_MS);
}
