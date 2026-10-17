import { nextBuildingUnlock, totalCitizens, type BuildingType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';

const LISTED = 3;

interface NextBuildingUnlockProps {
  candidates: readonly BuildingType[];
}

export function NextBuildingUnlock({ candidates }: NextBuildingUnlockProps) {
  const state = useGame(store => store.state);
  const next = nextBuildingUnlock(state, candidates);
  if (!next) return null;
  const current = totalCitizens(state);
  return (
    <div className="next-building-unlock" role="group" aria-label={t('build.nextUnlock')}>
      <h4>{t('build.nextUnlock')}</h4>
      <p>{next.types.slice(0, LISTED).map(type => t(`building.${type}`)).join(', ')}{next.types.length > LISTED && ` +${next.types.length - LISTED}`}</p>
      <progress max={next.citizens} value={Math.min(current, next.citizens)} />
      <small>{t('build.nextUnlockProgress').replace('{current}', String(current)).replace('{citizens}', String(next.citizens))}</small>
    </div>
  );
}
