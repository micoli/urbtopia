import { createContext, useContext, type MouseEvent } from 'react';
import type { CodexId } from '../../codex/catalog';
import type { CodexPage } from '../../codex/pages';
import type { Language } from '../../i18n/prefsStore';
import { GuideRouteContext } from '../guideRouteContext';
import { articlePathOf, codexEntryOf, codexEntryPathOf, hrefOf, rulesPathOf, type GuideRoute } from '../routes';
import type { Article } from './articles';

export interface ArticleTarget {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

// Where the links of an article lead: other pages of the Guide, or other pages of the in-game Codex.
export interface ArticleLinker {
  language: Language;
  entry: (id: CodexId) => ArticleTarget;
  rules: (id: CodexPage) => ArticleTarget;
  article: (article: Article) => ArticleTarget;
}

export const ArticleLinkerContext = createContext<ArticleLinker | null>(null);

export const guideLinkerOf = (route: GuideRoute): ArticleLinker => ({
  language: route.language,
  entry: id => ({ href: hrefOf(route, codexEntryPathOf(route.language, codexEntryOf(id))) }),
  rules: id => ({ href: hrefOf(route, rulesPathOf(route.language, id)) }),
  article: article => ({ href: hrefOf(route, articlePathOf(route.language, article)) }),
});

export function useArticleLinker(): ArticleLinker {
  const injected = useContext(ArticleLinkerContext);
  const route = useContext(GuideRouteContext);
  if (injected) return injected;
  if (!route) throw new Error('useArticleLinker needs an ArticleLinkerContext or a GuideRouteContext');
  return guideLinkerOf(route);
}
