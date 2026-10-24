import { CODEX_PAGES } from '../codex/pages';
import { t } from '../i18n/t';
import { codexEntryOf, type GuideRoute } from './routes';

function pageTitleOf({ page }: GuideRoute): string | null {
  if (page.kind === 'codexIndex') return t('guide.codex');
  if (page.kind === 'codexSection') return t(page.section);
  if (page.kind === 'codexEntry') return t(codexEntryOf(page.id).name);
  if (page.kind === 'rules') return t(CODEX_PAGES.find(item => item.id === page.id)!.title);
  return null;
}

export function titleOf(route: GuideRoute): string {
  if (route.page.kind === 'languageChoice') return 'Urbtopia Guide';
  const title = pageTitleOf(route);
  return title ? `${title} · ${t('guide.name')}` : t('guide.name');
}
