import type { CodexEntry } from '../../codex/catalog';
import type { CodexPage } from '../../codex/pages';
import { codexEntryPathOf, rulesPathOf } from '../../guide/paths';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';

interface CodexGuideLinkProps {
  entry: CodexEntry;
  page: CodexPage | null;
}

export function CodexGuideLink({ entry, page }: CodexGuideLinkProps) {
  const language = prefsStore.getState().language;
  const path = page ? rulesPathOf(language, page) : codexEntryPathOf(language, entry);
  return <a className="codex-guide-link" href={`${import.meta.env.BASE_URL}docs/${path}`} target="_blank" rel="noopener">{t('codex.openInGuide')}</a>;
}
