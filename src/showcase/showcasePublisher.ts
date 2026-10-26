import type { ParseOptions } from '../persistence/envelope';
import { showcaseContent } from './showcaseEnvelope';
import { ShowcaseError, type ShowcaseClient, type ShowcaseStatus } from './types';

export interface ShowcasePublisherDeps {
  client: ShowcaseClient;
  isMember: () => boolean;
  readLocal: () => string | null;
  cityName: () => string;
  onStatus: (status: ShowcaseStatus | null) => void;
  parseOptions?: ParseOptions;
}

export class ShowcasePublisher {
  private current: ShowcaseStatus | null = null;
  private busy = false;
  private queued: string | null = null;
  private loading: Promise<ShowcaseStatus | null> | null = null;

  constructor(private deps: ShowcasePublisherDeps) {}

  get status(): ShowcaseStatus | null {
    return this.current;
  }

  loadStatus(): Promise<ShowcaseStatus | null> {
    this.loading ??= this.fetchStatus().finally(() => {
      this.loading = null;
    });
    return this.loading;
  }

  async publish(envelope: string): Promise<void> {
    if (!this.deps.isMember()) return;
    const status = this.current ?? (await this.loadStatus());
    if (!status || status.optedOut || !status.noticeSeen) return;
    if (this.busy) {
      this.queued = envelope;
      return;
    }
    const content = showcaseContent(envelope, this.deps.parseOptions);
    if (!content) return;
    this.busy = true;
    try {
      await this.deps.client.publish(content.envelope, content.formatVersion, content.citizens, this.deps.cityName());
    } catch (error) {
      if (error instanceof ShowcaseError && error.kind === 'notice-required') this.setStatus({ ...status, noticeSeen: false });
    } finally {
      this.busy = false;
    }
    const next = this.queued;
    this.queued = null;
    if (next) await this.publish(next);
  }

  async acknowledgeNotice(): Promise<void> {
    await this.deps.client.markNoticeSeen();
    this.setStatus({ optedOut: this.current?.optedOut ?? false, noticeSeen: true });
    await this.publishLocal();
  }

  async setOptOut(optedOut: boolean): Promise<void> {
    await this.deps.client.setOptOut(optedOut);
    this.setStatus({ optedOut, noticeSeen: true });
    if (!optedOut) await this.publishLocal();
  }

  private async fetchStatus(): Promise<ShowcaseStatus | null> {
    if (!this.deps.isMember()) return this.setStatus(null);
    try {
      return this.setStatus(await this.deps.client.status());
    } catch {
      return this.current;
    }
  }

  private async publishLocal(): Promise<void> {
    const local = this.deps.readLocal();
    if (local) await this.publish(local);
  }

  private setStatus(status: ShowcaseStatus | null): ShowcaseStatus | null {
    this.current = status;
    this.deps.onStatus(status);
    return status;
  }
}
