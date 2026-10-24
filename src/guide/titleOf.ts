import { t } from '../i18n/t';
import { codexEntryOf, type GuideRoute } from './routes';

function pageTitleOf({ page }: GuideRoute): string | null {
  if (page.kind === 'codexIndex') return t('guide.codex');
  if (page.kind === 'codexSection') return t(page.section);
  if (page.kind === 'codexEntry') return t(codexEntryOf(page.id).name);
  return null;
}

export function titleOf(route: GuideRoute): string {
  if (route.page.kind === 'languageChoice') return 'Urbtopia Guide';
  const title = pageTitleOf(route);
  return title ? `${title} · ${t('guide.name')}` : t('guide.name');
}
