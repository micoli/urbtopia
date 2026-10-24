import { ShowcaseError, type HallOfFameEntry, type Showcase, type ShowcaseClient, type ShowcaseStatus } from './types';

export interface PublishedShowcase {
  envelope: string;
  formatVersion: number;
  citizens: number;
}

export class FakeShowcaseClient implements ShowcaseClient {
  statusValue: ShowcaseStatus = { optedOut: false, noticeSeen: false };
  published: PublishedShowcase[] = [];
  entries: HallOfFameEntry[] = [];
  showcases = new Map<string, Showcase>();
  member = true;
  offline = false;

  async status(): Promise<ShowcaseStatus> {
    this.check();
    if (!this.member) throw new ShowcaseError('handle-required');
    return { ...this.statusValue };
  }

  async markNoticeSeen(): Promise<void> {
    this.check();
    this.statusValue = { ...this.statusValue, noticeSeen: true };
  }

  async setOptOut(optedOut: boolean): Promise<void> {
    this.check();
    this.statusValue = { optedOut, noticeSeen: true };
    if (optedOut) this.published = [];
  }

  async publish(envelope: string, formatVersion: number, citizens: number): Promise<void> {
    this.check();
    if (!this.statusValue.noticeSeen) throw new ShowcaseError('notice-required');
    if (this.statusValue.optedOut) return;
    this.published.push({ envelope, formatVersion, citizens });
  }

  async hallOfFame(): Promise<HallOfFameEntry[]> {
    this.check();
    return this.entries.map((entry) => ({ ...entry }));
  }

  async getShowcase(userId: string): Promise<Showcase> {
    this.check();
    const showcase = this.showcases.get(userId);
    if (!showcase) throw new ShowcaseError('not-found');
    return showcase;
  }

  private check(): void {
    if (this.offline) throw new ShowcaseError('offline');
  }
}
