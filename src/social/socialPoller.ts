export const PANEL_OPEN_INTERVAL_MS = 15_000;
export const PANEL_CLOSED_INTERVAL_MS = 60_000;

export interface PollerView {
  active: boolean;
  panelOpen: boolean;
  hidden: boolean;
}

export interface PollerDeps {
  poll: () => Promise<void>;
  view: () => PollerView;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export class SocialPoller {
  private handle: unknown = null;
  private interval: number | null = null;
  private running = false;
  private readonly setTimer: NonNullable<PollerDeps['setTimer']>;
  private readonly clearTimer: NonNullable<PollerDeps['clearTimer']>;

  constructor(private deps: PollerDeps) {
    this.setTimer = deps.setTimer ?? ((callback, ms) => setInterval(callback, ms));
    this.clearTimer = deps.clearTimer ?? ((handle) => clearInterval(handle as ReturnType<typeof setInterval>));
  }

  // Call whenever the view may have changed: it starts, retimes or stops the polling, and polls at once when it resumes or the panel opens.
  update(): void {
    const next = this.intervalFor(this.deps.view());
    if (next === this.interval) return;
    const wasActive = this.interval !== null;
    const wasOpen = this.interval === PANEL_OPEN_INTERVAL_MS;
    this.stop();
    this.interval = next;
    if (next === null) return;
    this.handle = this.setTimer(() => void this.run(), next);
    if (!wasActive || (next === PANEL_OPEN_INTERVAL_MS && !wasOpen)) void this.run();
  }

  dispose(): void {
    this.stop();
    this.interval = null;
  }

  private intervalFor(view: PollerView): number | null {
    if (!view.active || view.hidden) return null;
    return view.panelOpen ? PANEL_OPEN_INTERVAL_MS : PANEL_CLOSED_INTERVAL_MS;
  }

  private stop(): void {
    if (this.handle === null) return;
    this.clearTimer(this.handle);
    this.handle = null;
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.deps.poll();
    } finally {
      this.running = false;
    }
  }
}
