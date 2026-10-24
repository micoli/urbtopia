import type { CodexId } from '../codex/catalog';
import type { Language } from '../i18n/prefsStore';

export type GuidePage = { kind: 'languageChoice' } | { kind: 'home' } | { kind: 'codexEntry'; id: CodexId };

export interface GuideRoute {
  path: string;
  language: Language;
  page: GuidePage;
}

export const GUIDE_LANGUAGES: readonly Language[] = ['en', 'fr'];

const CODEX_ENTRY_PATHS: readonly { group: string; slug: string; id: CodexId }[] = [{ group: 'buildings', slug: 'home', id: 'home' }];

export const GUIDE_ROUTES: readonly GuideRoute[] = [
  { path: '', language: 'en', page: { kind: 'languageChoice' } },
  ...GUIDE_LANGUAGES.flatMap((language): GuideRoute[] => [
    { path: `${language}/`, language, page: { kind: 'home' } },
    ...CODEX_ENTRY_PATHS.map(({ group, slug, id }): GuideRoute => ({ path: `${language}/codex/${group}/${slug}/`, language, page: { kind: 'codexEntry', id } })),
  ]),
];

export function guideRouteOf(pathname: string): GuideRoute {
  const path = (/\/docs\/(.*)$/.exec(pathname)?.[1] ?? '').replace(/index\.html$/, '').replace(/([^/])$/, '$1/');
  return GUIDE_ROUTES.find(route => route.path === path) ?? GUIDE_ROUTES[0]!;
}

export const docsRootOf = (route: GuideRoute): string => '../'.repeat(route.path.split('/').filter(Boolean).length);

export const gameRootOf = (route: GuideRoute): string => `${docsRootOf(route)}../`;

export const hrefOf = (from: GuideRoute, to: string): string => `${docsRootOf(from)}${to}` || './';
