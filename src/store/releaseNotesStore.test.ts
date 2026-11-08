import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withReleaseNote } from '../releaseNotes/releaseNote';
import { parseLastSeenId, RELEASE_NOTES_SEEN_KEY, releaseNotesStore } from './releaseNotesStore';

const NOTE = { title: { en: 'A', fr: 'A' }, items: { en: ['x'], fr: ['x'] } };
const github = (tags: string[]) => (async () => ({ ok: true, json: async () => tags.map(tag => ({ tag_name: tag, published_at: '2026-11-08T10:00:00Z', created_at: '2026-11-08T10:00:00Z', body: withReleaseNote(null, NOTE) })) })) as unknown as typeof fetch;

describe('parseLastSeenId', () => {
  it('keeps a stored tag and drops an empty value', () => {
    expect(parseLastSeenId(null)).toBeNull();
    expect(parseLastSeenId(' ')).toBeNull();
    expect(parseLastSeenId('2026.11.08.02-softly-vivid-fox-1116')).toBe('2026.11.08.02-softly-vivid-fox-1116');
  });
});

describe('releaseNotesStore', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
    releaseNotesStore.setState({ releases: [], loadStarted: false, lastSeenId: null, reviewing: false });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('remembers the release seen, in the browser', () => {
    releaseNotesStore.getState().markSeen('b');
    expect(releaseNotesStore.getState().lastSeenId).toBe('b');
    expect(storage.get(RELEASE_NOTES_SEEN_KEY)).toBe('b');
  });

  it('starts a new browser on the latest release, so it is told nothing', async () => {
    await releaseNotesStore.getState().load(github(['b', 'a']));
    expect(releaseNotesStore.getState().lastSeenId).toBe('b');
    expect(storage.get(RELEASE_NOTES_SEEN_KEY)).toBe('b');
  });

  it('keeps what a returning browser has seen', async () => {
    releaseNotesStore.setState({ lastSeenId: 'a' });
    await releaseNotesStore.getState().load(github(['b', 'a']));
    expect(releaseNotesStore.getState().lastSeenId).toBe('a');
    expect(releaseNotesStore.getState().releases.map(release => release.id)).toEqual(['b', 'a']);
  });

  it('forgets the last seen release so the notes come back', async () => {
    releaseNotesStore.getState().markSeen('b');
    await releaseNotesStore.getState().load(github(['b', 'a']));
    releaseNotesStore.getState().forgetLastSeen();
    expect(storage.has(RELEASE_NOTES_SEEN_KEY)).toBe(false);
    expect(releaseNotesStore.getState().lastSeenId).toBe('a');
  });

  it('asks GitHub once', async () => {
    const fetchImpl = vi.fn(github(['a']));
    await releaseNotesStore.getState().load(fetchImpl);
    await releaseNotesStore.getState().load(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
