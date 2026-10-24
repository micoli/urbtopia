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
  avatar: string | null;
  formatVersion: number;
  envelope: string;
}

export interface ShowcaseClient {
  status(): Promise<ShowcaseStatus>;
  markNoticeSeen(): Promise<void>;
  setOptOut(optedOut: boolean): Promise<void>;
  publish(envelope: string, formatVersion: number, citizens: number): Promise<void>;
  hallOfFame(): Promise<HallOfFameEntry[]>;
  getShowcase(userId: string): Promise<Showcase>;
}
