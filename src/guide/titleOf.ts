import { CODEX_ENTRIES } from '../codex/catalog';
import { t } from '../i18n/t';
import type { GuideRoute } from './routes';

export function titleOf({ page }: GuideRoute): string {
  if (page.kind === 'languageChoice') return 'Urbtopia Guide';
  if (page.kind === 'home') return t('guide.name');
  return `${t(CODEX_ENTRIES.find(entry => entry.id === page.id)!.name)} · ${t('guide.name')}`;
}
