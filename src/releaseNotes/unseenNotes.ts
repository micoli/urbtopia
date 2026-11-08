import type { PublishedRelease, ReleaseNote } from './releaseNote';

// Releases come newest first; a release without a note is skipped.
export function notesOf(releases: readonly PublishedRelease[]): readonly ReleaseNote[] {
  return releases.flatMap(release => (release.note ? [{ id: release.id, publishedAt: release.publishedAt, ...release.note }] : []));
}

// Without a last seen release the player is new to this browser: nothing to tell.
export function hasUnseenNotes(releases: readonly PublishedRelease[], lastSeenId: string | null): boolean {
  if (lastSeenId === null) return false;
  const seenIndex = releases.findIndex(release => release.id === lastSeenId);
  const newer = seenIndex === -1 ? releases : releases.slice(0, seenIndex);
  return notesOf(newer).length > 0;
}
