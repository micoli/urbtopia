import type { WasteKindFigures } from '../../core';
import { t } from '../../i18n/t';

export function WasteAllocationRow({ figures }: { figures: WasteKindFigures }) {
  const state = figures.buildings === 0 ? t('codex.waste.none') : figures.stopped ? t(`codex.waste.stopped.${figures.stopped}`) : t('codex.waste.running');
  return (
    <tr data-stopped={figures.stopped !== null}>
      <th scope="row">{t(`building.${figures.kind}`)}</th>
      <td>{figures.buildings}</td>
      <td>{figures.capacity < figures.nominalCapacity ? `${figures.capacity.toFixed(0)} / ${figures.nominalCapacity}` : figures.capacity}</td>
      <td>{figures.processed.toFixed(1)}</td>
      <td>{figures.cost.toFixed(1)}</td>
      <td>{state}</td>
    </tr>
  );
}
