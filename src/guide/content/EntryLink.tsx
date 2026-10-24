import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useGuideRoute } from '../guideRouteContext';
import { codexEntryOf, codexEntryPathOf, hrefOf } from '../routes';

interface EntryLinkProps {
  id: CodexId;
  children?: string;
}

export function EntryLink({ id, children }: EntryLinkProps) {
  const route = useGuideRoute();
  const entry = codexEntryOf(id);
  return <a href={hrefOf(route, codexEntryPathOf(route.language, entry))}>{children ?? t(entry.name)}</a>;
}
