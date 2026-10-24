import { CODEX_ENTRIES, type CodexId } from '../codex/catalog';
import { t } from '../i18n/t';
import { LevelFacts } from '../ui/codex/LevelFacts';
import type { GuideData } from './guideData';
import { gameRootOf, hrefOf, type GuideRoute } from './routes';

interface CodexEntryPageProps {
  route: GuideRoute;
  id: CodexId;
  data: GuideData;
}

export function CodexEntryPage({ route, id, data }: CodexEntryPageProps) {
  const entry = CODEX_ENTRIES.find(item => item.id === id)!;
  return (
    <main className="guide-page">
      <nav><a href={hrefOf(route, `${route.language}/`)}>{t('guide.name')}</a></nav>
      <p className="guide-section">{t(entry.section)}</p>
      <h1>{t(entry.name)}</h1>
      <p>{t(entry.description)}</p>
      <p>{entry.unlockCitizens === 0 ? t('codex.fromStart') : t('codex.unlock').replace('{count}', String(entry.unlockCitizens))}</p>
      <h2>{t('codex.gallery')}</h2>
      <div className="guide-gallery">
        {entry.levels.map(level => (
          <figure key={level}>
            <img
              src={`${gameRootOf(route)}codex/${data.images[level]}`}
              width={512} height={512}
              alt={t('codex.preview').replace('{name}', t(entry.name)).replace('{level}', String(level))}
            />
            <figcaption>{t('codex.level').replace('{level}', String(level))}</figcaption>
            <LevelFacts id={entry.id} level={level} />
          </figure>
        ))}
      </div>
    </main>
  );
}
