import type { BugReportReply, BugReportStatus, BugReportSummary, BugReportThread } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStatus(value: unknown): value is BugReportStatus {
  return value === 'new' || value === 'seen' || value === 'resolved';
}

export function parseSummaries(data: unknown): BugReportSummary[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { id, description, status, createdAt, unread } = row;
    if (typeof id !== 'number' || typeof description !== 'string' || !isStatus(status) || typeof createdAt !== 'string') return [];
    return [{ id, description, status, createdAt, unread: unread === true }];
  });
}

export function parseThread(data: unknown): BugReportThread | null {
  if (!isRecord(data)) return null;
  const { id, description, status, createdAt, replies } = data;
  if (typeof id !== 'number' || typeof description !== 'string' || !isStatus(status) || typeof createdAt !== 'string') return null;
  return { id, description, status, createdAt, replies: parseReplies(replies) };
}

function parseReplies(data: unknown): BugReportReply[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!isRecord(row)) return [];
    const { id, fromAdmin, body, createdAt } = row;
    if (typeof id !== 'number' || typeof fromAdmin !== 'boolean' || typeof body !== 'string' || typeof createdAt !== 'string') return [];
    return [{ id, fromAdmin, body, createdAt }];
  });
}
