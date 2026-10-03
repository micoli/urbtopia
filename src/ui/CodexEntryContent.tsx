import { useState } from 'react';
import { totalCitizens } from '../core';
import { codexImageKey, type CodexEntry, type CodexManifest } from '../codex/catalog';
import { t } from '../i18n/t';
import { useGame } from './hooks';
import { readHomeColor } from './homeColor';

interface CodexEntryContentProps {
  entry: CodexEntry;
  manifest: CodexManifest | null;
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
            <figcaption>{t('codex.level').replace('{level}', String(level))}</figcaption>
          </figure>
        ))}
      </div>}
    </>
  );
}
