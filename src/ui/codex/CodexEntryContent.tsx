import { useState } from 'react';
import { isCrop, totalCitizens } from '../../core';
import { codexImageKey, type CodexEntry, type CodexManifest } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { readHomeColor } from '../buildings/homeColor';
import { CropFacts } from './CropFacts';
import { LevelFacts } from './LevelFacts';

interface CodexEntryContentProps {
  entry: CodexEntry;
  manifest: CodexManifest | null;
}

function captionOf(entry: CodexEntry, level: number): string {
  if (!isCrop(entry.id)) return t('codex.level').replace('{level}', String(level));
  return level > 4 ? t('codex.stageReady') : t('codex.stage').replace('{level}', String(level));
}

export function CodexEntryContent({ entry, manifest }: CodexEntryContentProps) {
  const citizens = useGame(store => totalCitizens(store.state));
  const [failedImages, setFailedImages] = useState<readonly number[]>([]);
  const colorVariant = entry.id === 'home' || entry.id === 'solarHome' ? readHomeColor() : undefined;
  const available = citizens >= entry.unlockCitizens;
  return (
    <>
      <p className="codex-section-name">{t(entry.section)}</p>
      <h3 className="codex-entry-name">{t(entry.name)}</h3>
      <p>{t(entry.description)}</p>
      <p className="codex-unlock">
        <strong data-available={available}>{t(available ? 'codex.available' : 'codex.locked')}</strong>
        <span>{entry.unlockCitizens === 0 ? t('codex.fromStart') : t('codex.unlock').replace('{count}', String(entry.unlockCitizens))}</span>
      </p>
      {isCrop(entry.id) ? <CropFacts crop={entry.id} /> : null}
      <h4>{t('codex.gallery')}</h4>
      {manifest && <div className="codex-gallery">
        {entry.levels.map(level => (
          <figure key={level}>
            {failedImages.includes(level) ? <p role="alert">{t('codex.loadFailed')}</p> : <img
              src={`${import.meta.env.BASE_URL}codex/${manifest.images[codexImageKey(entry.id, level, colorVariant)]}`}
              width={512} height={512}
              alt={t('codex.preview').replace('{name}', t(entry.name)).replace('{level}', String(level))}
              onError={() => setFailedImages(levels => [...levels, level])}
            />}
            <figcaption>{captionOf(entry, level)}</figcaption>
            {!isCrop(entry.id) && <LevelFacts id={entry.id} level={level} />}
          </figure>
        ))}
      </div>}
    </>
  );
}
