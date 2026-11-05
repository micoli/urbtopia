import type { CodexEntry } from '../../codex/catalog';
import type { CodexPage } from '../../codex/pages';
import type { Article } from '../../guide/content/articles';
import { articlePathOf } from '../../guide/routes';
import { codexEntryPathOf, rulesPathOf } from '../../guide/paths';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';

interface CodexGuideLinkProps {
  entry: CodexEntry;
  page: CodexPage | null;
  article: Article | null;
}

function guidePathOf({ entry, page, article }: CodexGuideLinkProps): string {
  const language = prefsStore.getState().language;
  if (article) return articlePathOf(language, article);
  if (page) return rulesPathOf(language, page);
  return codexEntryPathOf(language, entry);
}

export function CodexGuideLink(props: CodexGuideLinkProps) {
  return <a className="codex-guide-link" href={`${import.meta.env.BASE_URL}docs/${guidePathOf(props)}`} target="_blank" rel="noopener">{t('codex.openInGuide')}</a>;
}
