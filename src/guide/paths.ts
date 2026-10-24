import type { CodexEntry, CodexSection } from '../codex/catalog';
import type { CodexPage } from '../codex/pages';
import type { Language } from '../i18n/prefsStore';
import { MESSAGES } from '../i18n/messages';

const kebabOf = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const codexSectionSlugOf = (section: CodexSection): string => MESSAGES[section].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const codexSectionPathOf = (language: Language, section: CodexSection): string => `${language}/codex/${codexSectionSlugOf(section)}/`;

export const codexEntryPathOf = (language: Language, entry: CodexEntry): string => `${codexSectionPathOf(language, entry.section)}${kebabOf(entry.id)}/`;

export const rulesSlugOf = (id: CodexPage): string => kebabOf(id);

export const rulesPathOf = (language: Language, id: CodexPage): string => `${language}/mechanics/${rulesSlugOf(id)}/`;
