import { copyThresholds, maxCopies, nextCopyCost, ownedCopies, totalCitizens, type BuildingType, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { Icon } from '../common/Icon';

interface BuildLimitRowProps {
  type: BuildingType;
  state: GameState;
}

export function BuildLimitRow({ type, state }: BuildLimitRowProps) {
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
            {citizens >= threshold ? null : <><Icon name="lock" />{' '}</>}{threshold}
          </span>
        ))}
      </td>
      <td>{owned >= max ? t('codex.storage.maxed') : <UrbsAmount value={nextCopyCost(state, type)} />}</td>
    </tr>
  );
}
