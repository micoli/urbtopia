import { BUILDING_SPECS, ECOLOGY_UNLOCKS, maxCopies, maxTierOf, nextCopyCitizens, nextCopyCost, ownedCopies, storageTierOf, type StorageType } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';

const COMPARTMENTS = [
  ['panel.materials', 'materials'],
  ['panel.crops', 'crops'],
  ['panel.goods', 'goods'],
] as const;

export function StorageRulesRow({ type }: { type: StorageType }) {
  const state = useGame((store) => store.state);
  const owned = ownedCopies(state, type);
  const max = maxCopies(type);
  const first = storageTierOf(type, 1);
  const last = storageTierOf(type, maxTierOf(type));
  const capacities = COMPARTMENTS.filter(([, compartment]) => last[compartment] > 0);
  const unlockCitizens = owned === 0 ? (ECOLOGY_UNLOCKS[type] ?? 0) : nextCopyCitizens(state, type);
  const maxed = owned >= max;
  return (
    <tr>
      <th scope="row">{t(`building.${type}`)}</th>
      <td>{owned}/{max}</td>
      <td>
        {capacities.map(([label, compartment]) => (
          <div key={compartment}>{t(label)}: {first[compartment]} → {last[compartment]}</div>
        ))}
      </td>
      <td>{maxed ? t('codex.storage.maxed') : <UrbsAmount value={owned === 0 ? BUILDING_SPECS[type].cost : nextCopyCost(state, type)} />}</td>
      <td>{maxed || unlockCitizens === null ? '—' : unlockCitizens}</td>
    </tr>
  );
}
