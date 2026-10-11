const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const VSYNC_TOLERANCE_MS = 4;
const MAX_PIXEL_RATIO = 1.5;
const ANTIALIAS_BELOW_PIXEL_RATIO = 2;

export function shouldRenderFrame(elapsedMs: number): boolean {
  return elapsedMs >= FRAME_INTERVAL_MS - VSYNC_TOLERANCE_MS;
}

export function renderPixelRatio(): number {
  return Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
}

export function wantsAntialias(): boolean {
  return window.devicePixelRatio < ANTIALIAS_BELOW_PIXEL_RATIO;
}

export function watchPageHidden(onChange: (hidden: boolean) => void): () => void {
  const listener = () => onChange(document.hidden);
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}
