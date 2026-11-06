import type { CityAttachment } from './cityAttachment';

export type BugReportStatus = 'new' | 'seen' | 'resolved';

export interface BugReportSubmission {
  description: string;
  camera: unknown;
  context: Record<string, unknown>;
  cityId: string | null;
  citySeed: string | null;
  screenshot: string | null;
  city: CityAttachment | null;
}

export interface BugReportSummary {
  id: number;
  description: string;
  status: BugReportStatus;
  createdAt: string;
  unread: boolean;
}

export interface BugReportReply {
  id: number;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
}

export interface BugReportThread {
  id: number;
  description: string;
  status: BugReportStatus;
  createdAt: string;
  replies: BugReportReply[];
}

export interface BugReportClient {
  send(report: BugReportSubmission): Promise<number>;
  list(): Promise<BugReportSummary[]>;
  get(id: number): Promise<BugReportThread>;
  reply(id: number, body: string): Promise<void>;
}

export type BugReportErrorKind = 'unauthenticated' | 'email-required' | 'rate-limited' | 'invalid' | 'not-found' | 'closed' | 'offline' | 'unknown';

export class BugReportError extends Error {
  constructor(
    readonly kind: BugReportErrorKind,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`bug-report-${kind}`);
  }
}
