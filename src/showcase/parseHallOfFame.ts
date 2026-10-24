import { ShowcaseError, type HallOfFameEntry, type Showcase, type ShowcaseStatus } from './types';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ShowcaseError('unknown');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ShowcaseError('unknown');
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new ShowcaseError('unknown');
  return value;
}

export function parseHallOfFame(data: unknown): HallOfFameEntry[] {
  if (!Array.isArray(data)) throw new ShowcaseError('unknown');
  return data.map((row) => {
    const entry = record(row);
    return {
      rank: integer(entry.rank),
      userId: text(entry.userId),
      handle: text(entry.handle),
      avatar: entry.avatar === null ? null : text(entry.avatar),
      citizens: integer(entry.citizens),
    };
  });
}

export function parseShowcase(data: unknown): Showcase {
  const row = record(data);
  return {
    handle: text(row.handle),
    avatar: row.avatar === null ? null : text(row.avatar),
    formatVersion: integer(row.formatVersion),
    envelope: JSON.stringify(row.envelope),
  };
}

export function parseStatus(data: unknown): ShowcaseStatus {
  const row = record(data);
  return { optedOut: row.optedOut === true, noticeSeen: row.noticeSeen === true };
}
