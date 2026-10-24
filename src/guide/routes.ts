import type { CodexId } from '../codex/catalog';
import type { Language } from '../i18n/prefsStore';
import type { MessageKey } from '../i18n/messages';

export type GuidePage = { kind: 'languageChoice' } | { kind: 'home' } | { kind: 'codexEntry'; id: CodexId };

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

const CODEX_ENTRY_PATHS: readonly { group: string; slug: string; id: CodexId }[] = [{ group: 'buildings', slug: 'home', id: 'home' }];

export const GUIDE_ROUTES: readonly GuideRoute[] = [
  { path: '', language: 'en', page: { kind: 'languageChoice' } },
  ...GUIDE_LANGUAGES.flatMap((language): GuideRoute[] => [
    { path: `${language}/`, language, page: { kind: 'home' } },
    ...CODEX_ENTRY_PATHS.map(({ group, slug, id }): GuideRoute => ({ path: `${language}/codex/${group}/${slug}/`, language, page: { kind: 'codexEntry', id } })),
  ]),
];

export function sectionOf({ page }: GuideRoute): GuideSection | null {
  if (page.kind === 'codexEntry') return 'codex';
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
