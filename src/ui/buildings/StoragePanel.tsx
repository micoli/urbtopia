import { compartmentOf, storageCapacity, storageUsed, type Building, type GoodId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { useGame } from '../common/hooks';
import { UpgradeSection } from './UpgradeSection';

interface StoragePanelProps {
  building: Building;
}

export function StoragePanel({ building }: StoragePanelProps) {
  const state = useGame((store) => store.state);
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const stocked = Object.entries(state.storage.materials).filter(([, amount]) => (amount ?? 0) > 0);
  const materials = stocked.filter(([item]) => compartmentOf(item) === 'materials');
  const crops = stocked.filter(([item]) => compartmentOf(item) === 'crops');
  const goods = Object.entries(state.storage.goods).filter(([, amount]) => (amount ?? 0) > 0);

  return (
    <section className="storehouse">
      <h3>
        {t('panel.stock')} · {t('panel.level')} {building.tier}
      </h3>
      <p>
        {t('panel.materials')}: {used.materials}/{capacity.materials}
      </p>
      <ul>
        {materials.map(([item, amount]) => (
          <li key={item}>
            {t(`item.${item as MaterialId}`)} × {amount}
          </li>
        ))}
      </ul>
      <p>
        {t('panel.crops')}: {used.crops}/{capacity.crops}
      </p>
      <ul>
        {crops.map(([item, amount]) => (
          <li key={item}>
            {t(`item.${item as MaterialId}`)} × {amount}
          </li>
        ))}
      </ul>
      <p>
        {t('panel.goods')}: {used.goods}/{capacity.goods}
      </p>
      <ul>
        {goods.map(([item, amount]) => (
          <li key={item}>
            {itemName(item as GoodId)} × {amount}
          </li>
        ))}
      </ul>
      <UpgradeSection building={building} />
    </section>
  );
}
