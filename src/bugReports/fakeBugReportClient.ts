import { MAX_DESCRIPTION_LENGTH, MAX_REPLY_LENGTH, MAX_REPORTS_PER_DAY } from './limits';
import { BugReportError, type BugReportClient, type BugReportReply, type BugReportStatus, type BugReportSubmission, type BugReportSummary, type BugReportThread } from './types';

const DAY_MS = 86_400_000;

interface StoredReport {
  id: number;
  submission: BugReportSubmission;
  status: BugReportStatus;
  createdAt: number;
  unread: boolean;
  replies: BugReportReply[];
}

export class FakeBugReportClient implements BugReportClient {
  readonly reports: StoredReport[] = [];
  failNext: BugReportError | null = null;
  private nextId = 1;

  constructor(
    private options: { hasEmail?: boolean; now?: () => number } = {},
  ) {}

  async send(submission: BugReportSubmission): Promise<number> {
    this.check();
    const description = submission.description.trim();
    if (description.length < 1 || description.length > MAX_DESCRIPTION_LENGTH) throw new BugReportError('invalid');
    const now = this.now();
    const recent = this.reports.filter((report) => report.createdAt > now - DAY_MS);
    const oldest = recent[0];
    if (oldest && recent.length >= MAX_REPORTS_PER_DAY) throw new BugReportError('rate-limited', Math.ceil((oldest.createdAt + DAY_MS - now) / 1000));
    const report: StoredReport = { id: this.nextId++, submission: { ...submission, description }, status: 'new', createdAt: now, unread: false, replies: [] };
    this.reports.push(report);
    return report.id;
  }

  async list(): Promise<BugReportSummary[]> {
    this.check();
    return [...this.reports].reverse().map((report) => ({ id: report.id, description: report.submission.description, status: report.status, createdAt: new Date(report.createdAt).toISOString(), unread: report.unread }));
  }

  async get(id: number): Promise<BugReportThread> {
    this.check();
    const report = this.find(id);
    report.unread = false;
    return { id, description: report.submission.description, status: report.status, createdAt: new Date(report.createdAt).toISOString(), replies: [...report.replies] };
  }

  async reply(id: number, body: string): Promise<void> {
    this.check();
    const text = body.trim();
    if (text.length < 1 || text.length > MAX_REPLY_LENGTH) throw new BugReportError('invalid');
    const report = this.find(id);
    if (report.status === 'resolved') throw new BugReportError('closed');
    report.replies.push({ id: report.replies.length + 1, fromAdmin: false, body: text, createdAt: new Date(this.now()).toISOString() });
  }

  adminReply(id: number, body: string): void {
    const report = this.find(id);
    report.replies.push({ id: report.replies.length + 1, fromAdmin: true, body, createdAt: new Date(this.now()).toISOString() });
    report.unread = true;
  }

  resolve(id: number): void {
    this.find(id).status = 'resolved';
  }

  private find(id: number): StoredReport {
    const report = this.reports.find((candidate) => candidate.id === id);
    if (!report) throw new BugReportError('not-found');
    return report;
  }

  private check(): void {
    if (this.options.hasEmail === false) throw new BugReportError('email-required');
    if (!this.failNext) return;
    const error = this.failNext;
    this.failNext = null;
    throw error;
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }
}
