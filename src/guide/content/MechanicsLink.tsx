import type { CodexPage } from '../../codex/pages';
import { CODEX_PAGES } from '../../codex/pages';
import { t } from '../../i18n/t';
import { useArticleLinker } from './articleLinker';

interface MechanicsLinkProps {
  id: CodexPage;
  children?: string;
}

export function MechanicsLink({ id, children }: MechanicsLinkProps) {
  const linker = useArticleLinker();
  return <a {...linker.rules(id)}>{children ?? t(CODEX_PAGES.find(page => page.id === id)!.title)}</a>;
}
