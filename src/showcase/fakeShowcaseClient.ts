import { ShowcaseError, type HallOfFameEntry, type Showcase, type ShowcaseClient, type ShowcaseStatus } from './types';

export interface PublishedShowcase {
  cityName: string;
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

  async publish(envelope: string, formatVersion: number, citizens: number, cityName: string): Promise<void> {
    this.check();
    if (!this.statusValue.noticeSeen) throw new ShowcaseError('notice-required');
    if (this.statusValue.optedOut) return;
    this.published.push({ cityName, envelope, formatVersion, citizens });
  }

  async hallOfFame(): Promise<HallOfFameEntry[]> {
    this.check();
    return this.entries.map((entry) => ({ ...entry }));
  }

  // A Showcase is found by `userId:cityId`, or by `userId` alone when the test does not care about the City.
  async getShowcase(userId: string, cityId: string): Promise<Showcase> {
    this.check();
    const showcase = this.showcases.get(`${userId}:${cityId}`) ?? this.showcases.get(userId);
    if (!showcase) throw new ShowcaseError('not-found');
    return showcase;
  }

  private check(): void {
    if (this.offline) throw new ShowcaseError('offline');
  }
}
