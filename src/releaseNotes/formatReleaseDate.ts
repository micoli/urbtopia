import type { NoteLanguage } from './releaseNote';

// "8 November 2026 at 13:48" in the player's language and time zone.
export function formatReleaseDate(isoDate: string, language: NoteLanguage): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(language, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
