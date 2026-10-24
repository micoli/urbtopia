import type { CodexPage } from '../../codex/pages';
import { CODEX_PAGES } from '../../codex/pages';
import { t } from '../../i18n/t';
import { useGuideRoute } from '../guideRouteContext';
import { hrefOf, rulesPathOf } from '../routes';

interface MechanicsLinkProps {
  id: CodexPage;
  children?: string;
}

export function MechanicsLink({ id, children }: MechanicsLinkProps) {
  const route = useGuideRoute();
  return <a href={hrefOf(route, rulesPathOf(route.language, id))}>{children ?? t(CODEX_PAGES.find(page => page.id === id)!.title)}</a>;
}
