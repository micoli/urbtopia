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

const SLOW_SAMPLES = 90;
const SLOW_MEDIAN_MS = 45;

// Watches the time between two rendered frames. The loop is capped at 30 FPS (about 33 ms), so a median well above that
// means the device cannot keep up, and optional effects should go.
export class FrameBudgetMonitor {
  private samples: number[] = [];

  push(elapsedMs: number): void {
    this.samples.push(elapsedMs);
    if (this.samples.length > SLOW_SAMPLES) this.samples.shift();
  }

  get isSlow(): boolean {
    if (this.samples.length < SLOW_SAMPLES) return false;
    const sorted = [...this.samples].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)]! > SLOW_MEDIAN_MS;
  }

  reset(): void {
    this.samples = [];
  }
}
