export type ShowcaseErrorKind =
  | 'offline'
  | 'unauthenticated'
  | 'email-required'
  | 'handle-required'
  | 'notice-required'
  | 'too-large'
  | 'not-found'
  | 'unknown';

export class ShowcaseError extends Error {
  constructor(readonly kind: ShowcaseErrorKind) {
    super(`showcase-${kind}`);
  }
}

export interface HallOfFameEntry {
  rank: number;
  userId: string;
  cityId: string;
  cityName: string;
  handle: string;
  avatar: string | null;
  citizens: number;
}

export interface ShowcaseStatus {
  optedOut: boolean;
  noticeSeen: boolean;
}

export interface Showcase {
  handle: string;
  cityName: string;
  avatar: string | null;
  formatVersion: number;
  envelope: string;
}

// A client acts for one City of the account: the one whose Showcase it publishes and whose opt-out it sets.
export interface ShowcaseClient {
  status(): Promise<ShowcaseStatus>;
  markNoticeSeen(): Promise<void>;
  setOptOut(optedOut: boolean): Promise<void>;
  publish(envelope: string, formatVersion: number, citizens: number, cityName: string): Promise<void>;
  hallOfFame(): Promise<HallOfFameEntry[]>;
  getShowcase(userId: string, cityId: string): Promise<Showcase>;
}
