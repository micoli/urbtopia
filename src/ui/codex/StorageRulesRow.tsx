import { maxTierOf, storageTierOf, type StorageType } from '../../core';
import { t } from '../../i18n/t';

const COMPARTMENTS = [
  ['panel.materials', 'materials'],
  ['panel.crops', 'crops'],
  ['panel.goods', 'goods'],
] as const;

export function StorageRulesRow({ type }: { type: StorageType }) {
  const first = storageTierOf(type, 1);
  const last = storageTierOf(type, maxTierOf(type));
  return (
    <tr>
      <th scope="row">{t(`building.${type}`)}</th>
      <td>
        {COMPARTMENTS.filter(([, compartment]) => last[compartment] > 0).map(([label, compartment]) => (
          <div key={compartment}>{t(label)}: {first[compartment]} → {last[compartment]}</div>
        ))}
      </td>
    </tr>
  );
}
