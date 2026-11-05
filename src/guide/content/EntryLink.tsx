import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { codexEntryOf } from '../routes';
import { useArticleLinker } from './articleLinker';

interface EntryLinkProps {
  id: CodexId;
  children?: string;
}

export function EntryLink({ id, children }: EntryLinkProps) {
  const linker = useArticleLinker();
  return <a {...linker.entry(id)}>{children ?? t(codexEntryOf(id).name)}</a>;
}
