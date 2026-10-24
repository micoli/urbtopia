import { useState } from 'react';
import { codexImageKey, HOME_COLOR_VARIANTS, isHomeCodexId, type CodexId } from '../codex/catalog';
import { levelCaptionOf } from '../codex/levelCaption';
import { isCrop, totalCitizens, type ColorVariant } from '../core';
import { t } from '../i18n/t';
import { AnnualEventFacts } from '../ui/codex/AnnualEventFacts';
import { BuildLimitList } from '../ui/codex/BuildLimitList';
import { CropFacts } from '../ui/codex/CropFacts';
import { LevelFacts } from '../ui/codex/LevelFacts';
import { ColorPicker } from './ColorPicker';
import type { GuideData } from './guideData';
import { RelatedRules } from './RelatedRules';
import { useReaderState } from './reader/useReaderState';
import { ModelViewer } from './viewer/ModelViewer';
import { codexEntryOf, gameRootOf, type GuideRoute } from './routes';

interface CodexEntryPageProps {
  route: GuideRoute;
  id: CodexId;
  data: GuideData;
}

export function CodexEntryPage({ route, id, data }: CodexEntryPageProps) {
  const entry = codexEntryOf(id);
  const [level, setLevel] = useState(entry.levels[0]!);
  const [color, setColor] = useState<ColorVariant>('default');
  const [view3d, setView3d] = useState(false);
  const state = useReaderState();
  const available = totalCitizens(state) >= entry.unlockCitizens;
  const imageOf = (shown: number) => `${gameRootOf(route)}codex/${data.images[codexImageKey(entry.id, shown, color)]}`;
  return (
    <article>
      <p className="guide-eyebrow">{t(entry.section)}</p>
      <h1>{t(entry.name)}</h1>
      <p className="max-w-3xl text-lg text-muted">{t(entry.description)}</p>
      <p className="flex flex-wrap items-center gap-2">
        <strong className={`guide-chip ${available ? 'border-positive text-positive' : 'text-muted'}`}>{t(available ? 'codex.available' : 'codex.locked')}</strong>
        <span className="text-sm text-muted">{entry.unlockCitizens === 0 ? t('codex.fromStart') : t('codex.unlock').replace('{count}', String(entry.unlockCitizens))}</span>
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <figure className="guide-panel">
          {view3d
            ? <ModelViewer modelsUrl={`${gameRootOf(route)}models/`} id={entry.id} level={level} colorVariant={isHomeCodexId(entry.id) ? color : undefined} fallback={imageOf(level)} />
            : <img className="mx-auto aspect-square w-full max-w-md" src={imageOf(level)} width={512} height={512} alt={t('codex.preview').replace('{name}', t(entry.name)).replace('{level}', String(level))} />}
          <figcaption className="flex items-center justify-between gap-2 font-semibold">
            {levelCaptionOf(entry, level)}
            <button type="button" className="guide-chip cursor-pointer font-normal" aria-pressed={view3d} onClick={() => setView3d(shown => !shown)}>{t(view3d ? 'guide.viewer3dHide' : 'guide.viewer3dShow')}</button>
          </figcaption>
        </figure>
        <div className="flex flex-col gap-6">
          {entry.levels.length > 1 && (
            <div role="radiogroup" aria-label={t('codex.gallery')} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {entry.levels.map(shown => (
                <button key={shown} type="button" role="radio" aria-checked={shown === level} className="guide-thumb" onClick={() => setLevel(shown)}>
                  <img className="aspect-square w-full" src={imageOf(shown)} width={128} height={128} alt="" loading="lazy" />
                  <span className="text-xs">{levelCaptionOf(entry, shown)}</span>
                </button>
              ))}
            </div>
          )}
          {isHomeCodexId(entry.id) && <ColorPicker variants={HOME_COLOR_VARIANTS} value={color} onChange={setColor} />}
          {isCrop(entry.id) ? <CropFacts crop={entry.id} /> : <LevelFacts id={entry.id} level={level} />}
          <BuildLimitList id={entry.id} state={state} />
          <AnnualEventFacts id={entry.id} />
        </div>
      </div>
      <RelatedRules route={route} section={entry.section} />
    </article>
  );
}
