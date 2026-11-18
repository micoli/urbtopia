export type NoteLanguage = 'en' | 'fr';

export interface ReleaseNoteContent {
  title: Record<NoteLanguage, string>;
  items: Record<NoteLanguage, readonly string[]>;
}

// `id` is the tag of the GitHub release the note belongs to, `publishedAt` the ISO date and time of that release.
export interface ReleaseNote extends ReleaseNoteContent {
  id: string;
  publishedAt: string;
}

export interface PublishedRelease {
  id: string;
  publishedAt: string;
  note: ReleaseNoteContent | null;
}

export const MAX_ITEMS = 6;
const LANGUAGES: readonly NoteLanguage[] = ['en', 'fr'];

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

// A note written for one pull request holds at most MAX_ITEMS items; a release that gathers several pull requests keeps every item.
export function parseReleaseNoteContent(value: unknown, maxItems = MAX_ITEMS): ReleaseNoteContent | null {
  if (typeof value !== 'object' || value === null) return null;
  const { title, items } = value as { title?: Record<string, unknown>; items?: Record<string, unknown> };
  if (!title || !items) return null;
  const parsedTitle = {} as Record<NoteLanguage, string>;
  const parsedItems = {} as Record<NoteLanguage, readonly string[]>;
  for (const language of LANGUAGES) {
    const languageTitle = title[language];
    const languageItems = items[language];
    if (!isText(languageTitle)) return null;
    if (!Array.isArray(languageItems) || languageItems.length === 0 || languageItems.length > maxItems || !languageItems.every(isText)) return null;
    parsedTitle[language] = languageTitle;
    parsedItems[language] = languageItems;
  }
  if (parsedItems.en.length !== parsedItems.fr.length) return null;
  return { title: parsedTitle, items: parsedItems };
}

// The note travels in the body of its GitHub release: the JSON hides in an HTML comment, followed by a readable copy.
const BLOCK = /<!-- urbtopia-release-note\n([\s\S]*?)\n-->[\s\S]*?<!-- \/urbtopia-release-note -->\n*/;

export function parseReleaseNote(body: string | null): ReleaseNoteContent | null {
  const json = body?.match(BLOCK)?.[1];
  if (json === undefined) return null;
  try {
    return parseReleaseNoteContent(JSON.parse(json), Number.POSITIVE_INFINITY);
  } catch {
    return null;
  }
}

// The note of a release made of several pull requests: the title of the newest one, then every item of every note, newest note first,
// the same sentence kept once.
export function mergeReleaseNotes(newestFirst: readonly ReleaseNoteContent[]): ReleaseNoteContent | null {
  const [newest] = newestFirst;
  if (!newest) return null;
  const merged = { en: [] as string[], fr: [] as string[] };
  const seen = new Set<string>();
  for (const note of newestFirst) {
    note.items.en.forEach((item, index) => {
      if (seen.has(item)) return;
      seen.add(item);
      merged.en.push(item);
      merged.fr.push(note.items.fr[index]!);
    });
  }
  return { title: newest.title, items: merged };
}

const FLAGS: Record<NoteLanguage, string> = { en: '🇬🇧', fr: '🇫🇷' };

function readable(note: ReleaseNoteContent): string {
  return LANGUAGES.map(language => [`## ${FLAGS[language]} ${note.title[language]}`, ...note.items[language].map(item => `- ${item}`)].join('\n')).join('\n\n');
}

const STARTS_WITH_EMOJI = /^\p{Extended_Pictographic}/u;

// A note is read at a glance: a title and every item lead with an emoji, and each item bolds its key words.
export function styleProblems(note: ReleaseNoteContent): string[] {
  const problems: string[] = [];
  for (const language of LANGUAGES) {
    if (!STARTS_WITH_EMOJI.test(note.title[language])) problems.push(`${language} title: start with an emoji`);
    note.items[language].forEach((item, index) => {
      if (!STARTS_WITH_EMOJI.test(item)) problems.push(`${language} item ${index + 1}: start with an emoji`);
      if (!item.includes('**')) problems.push(`${language} item ${index + 1}: put the key words in **bold**`);
    });
  }
  return problems;
}

// Replaces the note already in a release body, and keeps the rest (the generated notes).
export function withReleaseNote(body: string | null, note: ReleaseNoteContent): string {
  const rest = (body ?? '').replace(BLOCK, '').trim();
  const json = JSON.stringify(note).replaceAll('--', '-\\u002d');
  const block = `<!-- urbtopia-release-note\n${json}\n-->\n${readable(note)}\n<!-- /urbtopia-release-note -->`;
  return rest === '' ? `${block}\n` : `${block}\n\n${rest}\n`;
}
