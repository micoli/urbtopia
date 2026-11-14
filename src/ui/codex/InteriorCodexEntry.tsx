import { useMemo } from 'react';
import { liveInteriorsOf, tablesOf } from '../../codex/interiorFigures';
import { isInteriorUnlocked, type BuildingType, type GameState } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { InteriorExampleGrid } from '../factory/InteriorExampleGrid';
import { interiorEntryIdOf } from './InteriorEntryLink';
import { InteriorLiveList } from './InteriorLiveList';
import { InteriorRolesTable } from './InteriorRolesTable';
import { InteriorTiersTable } from './InteriorTiersTable';

interface InteriorCodexEntryProps {
  state: GameState;
  type: BuildingType;
}

export function InteriorCodexEntry({ state, type }: InteriorCodexEntryProps) {
  // The tables come from the rules alone, so the figures change only when the interior unlocks, not at every tick of the game.
  const unlocked = isInteriorUnlocked(state, type);
  const figures = useMemo(() => ({ ...tablesOf(type), unlocked }), [type, unlocked]);
  const live = useMemo(() => liveInteriorsOf(state, type), [state, type]);
  const { example } = figures;
  return (
    <section id={interiorEntryIdOf(type)} aria-label={t(`building.${type}`)}>
      <h4><u><strong>{t(`building.${type}`)}</strong></u></h4>
      <p>{t(`interior.features.${type}` as MessageKey)}</p>
      {figures.unlockCitizens > 0 ? <p className="note note--muted">{t(figures.unlocked ? 'codex.interiors.unlockOpen' : 'codex.interiors.unlockLocked').replace('{citizens}', String(figures.unlockCitizens))}</p> : null}
      <h5>{t('codex.interiors.benefits')}</h5>
      <p>{t('codex.interiors.benefitsHelp')}</p>
      <InteriorTiersTable figures={figures} />
      {figures.roles.length > 0 ? <InteriorRolesTable roles={figures.roles} /> : null}
      {example ? (
        <>
          <h5>{t('codex.interiors.example')}</h5>
          <p>{t(`interior.examples.${type}` as MessageKey)}</p>
          <p className="note note--muted">{t('codex.interiors.exampleTier').replace('{tier}', String(example.tier))}</p>
          <div className="interior-example">
            <InteriorExampleGrid fixtures={example.fixtures} />
          </div>
        </>
      ) : null}
      <h5>{t('codex.interiors.yours')}</h5>
      <InteriorLiveList interiors={live} />
      <hr/>
    </section>
  );
}
