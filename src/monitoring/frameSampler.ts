import { sentryReporter, type MetricAttributes, type MetricReporter } from './metricWindow';

const WINDOW_MS = 10_000;
// A longer gap between two frames means the tab was hidden or frozen: that is not a rendering speed.
const MAX_FRAME_GAP_MS = 1000;

export class FrameSampler {
  private windowStart: number | null = null;
  private lastFrame = 0;
  private frames = 0;
  private worstFrameMs = 0;

  constructor(
    private readonly describe: () => MetricAttributes,
    private readonly report: MetricReporter = sentryReporter,
  ) {}

  onFrame(now: number): void {
    if (this.windowStart === null || now - this.lastFrame > MAX_FRAME_GAP_MS) return this.restart(now);
    this.frames += 1;
    this.worstFrameMs = Math.max(this.worstFrameMs, now - this.lastFrame);
    this.lastFrame = now;
    const elapsed = now - this.windowStart;
    if (elapsed < WINDOW_MS) return;
    const attributes = this.describe();
    this.report('fps', (this.frames * 1000) / elapsed, 'none', attributes);
    this.report('frame_ms_worst', this.worstFrameMs, 'millisecond', attributes);
    this.restart(now);
  }

  private restart(now: number): void {
    this.windowStart = now;
    this.lastFrame = now;
    this.frames = 0;
    this.worstFrameMs = 0;
  }
}

export function installFrameSampler(sampler: FrameSampler): void {
  const onFrame = (now: number): void => {
    requestAnimationFrame(onFrame);
    sampler.onFrame(now);
  };
  requestAnimationFrame(onFrame);
}
