import { CODEX_ENTRIES, CODEX_SECTIONS } from '../../codex/catalog';
import { CODEX_PAGES } from '../../codex/pages';
import type { Language } from '../../i18n/prefsStore';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ARTICLES, translationOf, type ArticleSection } from '../content/articles';
import { articlePathOf, codexEntryPathOf, codexSectionPathOf, isRulesWrittenUp, rulesPathOf } from '../routes';
import type { MessageKey } from '../../i18n/messages';

export interface SearchItem {
  path: string;
  title: string;
  summary: string;
  section: string;
}

export function searchIndexOf(language: Language): SearchItem[] {
  prefsStore.setState({ language });
  const sectionTitles: Record<ArticleSection, MessageKey> = { gettingStarted: 'guide.gettingStarted', mechanics: 'guide.mechanics', glossary: 'guide.glossary' };
  return [
    ...ARTICLES.map(article => {
      const { meta } = translationOf(article, language);
      return { path: articlePathOf(language, article), title: meta.title, summary: meta.summary, section: t(sectionTitles[article.section]) };
    }),
    ...CODEX_PAGES.filter(page => !isRulesWrittenUp(page.id)).map(page => ({ path: rulesPathOf(language, page.id), title: t(page.title), summary: t(page.description), section: t('guide.mechanics') })),
    ...CODEX_SECTIONS.map(section => ({ path: codexSectionPathOf(language, section), title: t(section), summary: '', section: t('guide.codex') })),
    ...CODEX_ENTRIES.map(entry => ({ path: codexEntryPathOf(language, entry), title: t(entry.name), summary: t(entry.description), section: t(entry.section) })),
  ];
}
