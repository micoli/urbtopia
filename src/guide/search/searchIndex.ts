import { CODEX_ENTRIES, CODEX_SECTIONS } from '../../codex/catalog';
import { CODEX_PAGES } from '../../codex/pages';
import type { Language } from '../../i18n/prefsStore';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { codexEntryPathOf, codexSectionPathOf, rulesPathOf } from '../routes';

export interface SearchItem {
  path: string;
  title: string;
  summary: string;
  section: string;
}

export function searchIndexOf(language: Language): SearchItem[] {
  prefsStore.setState({ language });
  return [
    ...CODEX_PAGES.map(page => ({ path: rulesPathOf(language, page.id), title: t(page.title), summary: t(page.description), section: t('guide.mechanics') })),
    ...CODEX_SECTIONS.map(section => ({ path: codexSectionPathOf(language, section), title: t(section), summary: '', section: t('guide.codex') })),
    ...CODEX_ENTRIES.map(entry => ({ path: codexEntryPathOf(language, entry), title: t(entry.name), summary: t(entry.description), section: t(entry.section) })),
  ];
}
