import { cropReturns, CROPS, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { formatDuration } from '../common/formatDuration';
import { UrbsAmount } from '../common/UrbsAmount';

interface CropEconomyRowProps {
  crop: CropId;
  tiles: number;
  unlocked: boolean;
}

export function CropEconomyRow({ crop, tiles, unlocked }: CropEconomyRowProps) {
  const spec = CROPS[crop];
  const returns = cropReturns(crop, tiles);
  return (
    <tr data-unlocked={unlocked}>
      <th scope="row">
        {unlocked ? '' : '🔒 '}{t(`item.${crop}`)}
        <small>{formatDuration(spec.growthMs)} · {Math.round(spec.seedShare * 100)}%</small>
      </th>
      <td>{returns.seeds}</td>
      <td>{returns.stored}</td>
      <td><UrbsAmount value={returns.cropValue} /></td>
      <td><UrbsAmount value={returns.seedBalance} /></td>
      <td><UrbsAmount value={returns.profit} /></td>
      <td><UrbsAmount value={returns.profitPerHour} /></td>
    </tr>
  );
}
