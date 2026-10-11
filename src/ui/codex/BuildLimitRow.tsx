import { copyThresholds, maxCopies, nextCopyCost, ownedCopies, totalCitizens, type BuildingType } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

export function BuildLimitRow({ type }: { type: BuildingType }) {
  const state = useGame((store) => store.state);
  const owned = ownedCopies(state, type);
  const max = maxCopies(type);
  const citizens = totalCitizens(state);
  return (
    <tr>
      <th scope="row">{t(`building.${type}`)}</th>
      <td>{owned}/{max}</td>
      <td>
        {copyThresholds(type).map((threshold, index) => (
          <span key={index} data-reached={citizens >= threshold}>
            {index > 0 && ' · '}
            {citizens >= threshold ? '' : '🔒 '}{threshold}
          </span>
        ))}
      </td>
      <td>{owned >= max ? t('codex.storage.maxed') : <UrbsAmount value={nextCopyCost(state, type)} />}</td>
    </tr>
  );
}
