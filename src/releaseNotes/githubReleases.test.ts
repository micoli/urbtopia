import { describe, expect, it } from 'vitest';
import { fetchReleases } from './githubReleases';
import { withReleaseNote } from './releaseNote';

const NOTE = { title: { en: 'A', fr: 'A' }, items: { en: ['x'], fr: ['x'] } };
const answer = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

describe('fetchReleases', () => {
  it('reads the tag, the date and the note of each release, newest first', async () => {
    const releases = await fetchReleases(answer([
      { tag_name: 'b', published_at: '2026-11-08T12:48:45Z', created_at: '2026-11-08T12:40:00Z', body: withReleaseNote(null, NOTE) },
      { tag_name: 'a', published_at: null, created_at: '2026-11-07T08:00:00Z', body: null },
    ]));
    expect(releases).toEqual([
      { id: 'b', publishedAt: '2026-11-08T12:48:45Z', note: NOTE },
      { id: 'a', publishedAt: '2026-11-07T08:00:00Z', note: null },
    ]);
  });

  it('gives nothing when GitHub refuses, fails or answers something else', async () => {
    expect(await fetchReleases(answer({ message: 'rate limit' }, false))).toEqual([]);
    expect(await fetchReleases(answer({ message: 'oops' }))).toEqual([]);
    expect(await fetchReleases((async () => { throw new Error('offline'); }) as typeof fetch)).toEqual([]);
  });
});
