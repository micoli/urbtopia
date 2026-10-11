import { BUILDING_SPECS, copyThresholds, isRepeatable, maxCopies, nextCopyCost, ownedCopies, totalCitizens, type BuildingType } from '../../core';
import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

const isLimitedBuilding = (id: CodexId): id is BuildingType => id in BUILDING_SPECS && isRepeatable(id as BuildingType);

export function BuildLimitFacts({ id }: { id: CodexId }) {
  const state = useGame(store => store.state);
  if (!isLimitedBuilding(id)) return null;
  const owned = ownedCopies(state, id);
  const max = maxCopies(id);
  const citizens = totalCitizens(state);
  return (
    <>
      <h4>{t('codex.buildLimit.title')}</h4>
      <LabeledList className="codex-facts">
        <LabeledList.Row label={t('codex.buildLimit.built')}>{owned}/{max}</LabeledList.Row>
        {copyThresholds(id).map((threshold, index) => (
          <LabeledList.Row key={index} label={t('codex.buildLimit.copy').replace('{index}', String(index + 1))}>
            <span data-reached={citizens >= threshold}>
              {citizens >= threshold ? '' : '🔒 '}{threshold === 0 ? t('codex.fromStart') : t('codex.buildLimit.citizens').replace('{count}', String(threshold))}
            </span>
          </LabeledList.Row>
        ))}
        <LabeledList.Row label={t('codex.buildLimit.nextPrice')}>
          {owned >= max ? t('codex.storage.maxed') : <UrbsAmount value={nextCopyCost(state, id)} />}
        </LabeledList.Row>
      </LabeledList>
    </>
  );
}
