import type { CodexEntry } from '../codex/catalog';
import { t } from '../i18n/t';
import { firstImageOf, type GuideData } from './guideData';
import { codexEntryPathOf, gameRootOf, hrefOf, type GuideRoute } from './routes';

interface CodexEntryCardProps {
  route: GuideRoute;
  entry: CodexEntry;
  data: GuideData;
}

export function CodexEntryCard({ route, entry, data }: CodexEntryCardProps) {
  return (
    <a className="guide-tile" href={hrefOf(route, codexEntryPathOf(route.language, entry))}>
      <img className="aspect-square w-full" src={`${gameRootOf(route)}codex/${data.images[firstImageOf(entry)]}`} width={512} height={512} alt="" loading="lazy" />
      <span className="font-semibold">{t(entry.name)}</span>
      <span className="text-xs text-muted">{entry.unlockCitizens === 0 ? t('codex.fromStart') : t('codex.unlock').replace('{count}', String(entry.unlockCitizens))}</span>
    </a>
  );
}
