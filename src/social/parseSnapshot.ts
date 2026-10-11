import { SocialError, type BlockedPlayer, type Friend, type FriendRequest, type Message, type SocialSnapshot } from './types';

type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rows(value: unknown): Row[] {
  if (!Array.isArray(value) || !value.every(isRow)) throw new SocialError('unknown');
  return value;
}

function text(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new SocialError('unknown');
  return value;
}

function time(row: Row, key: string): number {
  const parsed = Date.parse(text(row, key));
  if (Number.isNaN(parsed)) throw new SocialError('unknown');
  return parsed;
}

function number(row: Row, key: string): number {
  const value = row[key];
  if (typeof value !== 'number') throw new SocialError('unknown');
  return value;
}

export function parseSnapshot(json: unknown): SocialSnapshot {
  if (!isRow(json)) throw new SocialError('unknown');
  const revision = number(json, 'revision');
  if (json.changed === false) return { changed: false, revision };
  if (typeof json.findable !== 'boolean') throw new SocialError('unknown');
  return {
    changed: true,
    revision,
    handle: text(json, 'handle'),
    findable: json.findable,
    handleChangedAt: time(json, 'handleChangedAt'),
    friends: rows(json.friends).map((row): Friend => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), since: time(row, 'since'), unread: number(row, 'unread'), lastMessageAt: row.lastMessageAt === null ? null : time(row, 'lastMessageAt') })),
    incoming: rows(json.incoming).map((row): FriendRequest => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), at: time(row, 'at') })),
    outgoing: rows(json.outgoing).map((row): FriendRequest => ({ userId: text(row, 'userId'), handle: text(row, 'handle'), at: time(row, 'at') })),
    blocked: rows(json.blocked).map((row): BlockedPlayer => ({ userId: text(row, 'userId'), handle: text(row, 'handle') })),
  };
}

export function parseMessages(json: unknown): Message[] {
  return rows(json).map((row): Message => {
    if (typeof row.fromMe !== 'boolean') throw new SocialError('unknown');
    return { id: number(row, 'id'), fromMe: row.fromMe, body: text(row, 'body'), at: time(row, 'at') };
  });
}
