import { CODEX_ENTRIES, CODEX_SECTIONS, type CodexEntry, type CodexId, type CodexSection } from '../codex/catalog';
import { CODEX_PAGES, type CodexPage } from '../codex/pages';
import type { Language } from '../i18n/prefsStore';
import { ARTICLE_DIRECTORIES, ARTICLES, type Article } from './content/articles';
import { MESSAGES, type MessageKey } from '../i18n/messages';

export type GuidePage =
  | { kind: 'languageChoice' }
  | { kind: 'home' }
  | { kind: 'codexIndex' }
  | { kind: 'codexSection'; section: CodexSection }
  | { kind: 'codexEntry'; id: CodexId }
  | { kind: 'rules'; id: CodexPage }
  | { kind: 'article'; article: Article };

export type GuideSection = 'gettingStarted' | 'mechanics' | 'codex' | 'glossary';

export interface GuideRoute {
  path: string;
  language: Language;
  page: GuidePage;
}

export const GUIDE_LANGUAGES: readonly Language[] = ['en', 'fr'];

export const GUIDE_SECTIONS: readonly { id: GuideSection; title: MessageKey }[] = [
  { id: 'gettingStarted', title: 'guide.gettingStarted' },
  { id: 'mechanics', title: 'guide.mechanics' },
  { id: 'codex', title: 'guide.codex' },
  { id: 'glossary', title: 'guide.glossary' },
];

const kebabOf = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const codexSectionSlugOf = (section: CodexSection): string => MESSAGES[section].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const codexSectionPathOf = (language: Language, section: CodexSection): string => `${language}/codex/${codexSectionSlugOf(section)}/`;

export const codexEntryPathOf = (language: Language, entry: CodexEntry): string => `${codexSectionPathOf(language, entry.section)}${kebabOf(entry.id)}/`;

export const rulesSlugOf = (id: CodexPage): string => kebabOf(id);

export const rulesPathOf = (language: Language, id: CodexPage): string => `${language}/mechanics/${rulesSlugOf(id)}/`;

export const articlePathOf = (language: Language, { section, slug }: Article): string => `${language}/${ARTICLE_DIRECTORIES[section]}/${slug === 'index' ? '' : `${slug}/`}`;

export const codexEntryOf = (id: CodexId): CodexEntry => CODEX_ENTRIES.find(entry => entry.id === id)!;

export const GUIDE_ROUTES: readonly GuideRoute[] = [
  { path: '', language: 'en', page: { kind: 'languageChoice' } },
  ...GUIDE_LANGUAGES.flatMap((language): GuideRoute[] => [
    { path: `${language}/`, language, page: { kind: 'home' } },
    ...ARTICLES.map((article): GuideRoute => ({ path: articlePathOf(language, article), language, page: { kind: 'article', article } })),
    { path: `${language}/codex/`, language, page: { kind: 'codexIndex' } },
    ...CODEX_SECTIONS.map((section): GuideRoute => ({ path: codexSectionPathOf(language, section), language, page: { kind: 'codexSection', section } })),
    ...CODEX_ENTRIES.map((entry): GuideRoute => ({ path: codexEntryPathOf(language, entry), language, page: { kind: 'codexEntry', id: entry.id } })),
    ...CODEX_PAGES.map(({ id }): GuideRoute => ({ path: rulesPathOf(language, id), language, page: { kind: 'rules', id } })),
  ]),
];

export function sectionOf({ page }: GuideRoute): GuideSection | null {
  if (page.kind === 'codexIndex' || page.kind === 'codexSection' || page.kind === 'codexEntry') return 'codex';
  if (page.kind === 'rules') return 'mechanics';
  if (page.kind === 'article') return page.article.section;
  return null;
}

export function codexSectionOf({ page }: GuideRoute): CodexSection | null {
  if (page.kind === 'codexSection') return page.section;
  if (page.kind === 'codexEntry') return codexEntryOf(page.id).section;
  return null;
}

export function guideRouteOf(pathname: string): GuideRoute {
  const path = (/\/docs\/(.*)$/.exec(pathname)?.[1] ?? '').replace(/index\.html$/, '').replace(/([^/])$/, '$1/');
  return GUIDE_ROUTES.find(route => route.path === path) ?? GUIDE_ROUTES[0]!;
}

export const translatedPathOf = (route: GuideRoute, language: Language): string => route.path.replace(/^[a-z]{2}\//, `${language}/`);

export const docsRootOf = (route: GuideRoute): string => '../'.repeat(route.path.split('/').filter(Boolean).length);

export const gameRootOf = (route: GuideRoute): string => `${docsRootOf(route)}../`;

export const hrefOf = (from: GuideRoute, to: string): string => `${docsRootOf(from)}${to}` || './';
