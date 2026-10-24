import { CODEX_ENTRIES, type CodexId } from '../codex/catalog';
import { t } from '../i18n/t';
import { LevelFacts } from '../ui/codex/LevelFacts';
import type { GuideData } from './guideData';
import { gameRootOf, type GuideRoute } from './routes';

interface CodexEntryPageProps {
  route: GuideRoute;
  id: CodexId;
  data: GuideData;
}

export function CodexEntryPage({ route, id, data }: CodexEntryPageProps) {
  const entry = CODEX_ENTRIES.find(item => item.id === id)!;
  return (
    <article>
      <p className="guide-eyebrow">{t(entry.section)}</p>
      <h1>{t(entry.name)}</h1>
      <p className="max-w-3xl text-lg text-muted">{t(entry.description)}</p>
      <p className="guide-chip inline-flex">{entry.unlockCitizens === 0 ? t('codex.fromStart') : t('codex.unlock').replace('{count}', String(entry.unlockCitizens))}</p>
      <h2>{t('codex.gallery')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {entry.levels.map(level => (
          <figure key={level} className="guide-panel">
            <img
              className="aspect-square w-full"
              src={`${gameRootOf(route)}codex/${data.images[level]}`}
              width={512} height={512}
              alt={t('codex.preview').replace('{name}', t(entry.name)).replace('{level}', String(level))}
            />
            <figcaption className="mb-2 font-semibold">{t('codex.level').replace('{level}', String(level))}</figcaption>
            <LevelFacts id={entry.id} level={level} />
          </figure>
        ))}
      </div>
    </article>
  );
}
