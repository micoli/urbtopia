import { useShallow } from 'zustand/react/shallow';
import { compartmentOf, storageTierOf, isStorageType, storageCapacity, storageUsed, type Building, type GoodId, type ItemId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { useGame } from '../common/hooks';
import { DrawerPanel } from '../common/DrawerPanel';
import { BlockedReason } from '../common/BlockedReason';
import { ItemIcon } from '../common/ItemIcon';
import { InteriorButton } from '../factory/InteriorButton';

interface StoragePanelProps {
  building: Building;
}

type Compartment = 'materials' | 'crops' | 'goods';

export function StoragePanel({ building }: StoragePanelProps) {
  const capacity = useGame(useShallow((store) => storageCapacity(store.state)));
  const materials = useGame((store) => store.state.storage.materials);
  const goods = useGame((store) => store.state.storage.goods);
  const used = storageUsed({ materials, goods });
  const stocked = Object.entries(materials).filter(([, amount]) => (amount ?? 0) > 0);
  const stock: Record<Compartment, [string, number | undefined][]> = {
    materials: stocked.filter(([item]) => compartmentOf(item) === 'materials'),
    crops: stocked.filter(([item]) => compartmentOf(item) === 'crops'),
    goods: Object.entries(goods).filter(([, amount]) => (amount ?? 0) > 0),
  };
  const compartments = (['materials', 'crops', 'goods'] as const).filter((compartment) => isStorageType(building.type) && storageTierOf(building.type, building.tier)[compartment] > 0);

  const isFull = compartments.some((compartment) => used[compartment] >= capacity[compartment]);
  const isEmpty = compartments.every((compartment) => stock[compartment].length === 0);
  return (
    <DrawerPanel>
      <InteriorButton building={building} />
      <BlockedReason reason={isFull ? t('storage.full') : isEmpty ? t('storage.empty') : null} />
      {compartments.map((compartment) => (
        <div key={compartment}>
          <p>
            {t(`panel.${compartment}`)}: {used[compartment]}/{capacity[compartment]}
          </p>
          <ul className="storage-tiles">
            {stock[compartment].map(([item, amount]) => (
              <li key={item} className="storage-tile">
                <span className="storage-tile-label">{compartment === 'goods' ? itemName(item as GoodId) : t(`item.${item as MaterialId}`)}</span>
                <span className="storage-tile-stock">
                  <span className="storage-tile-amount">{amount} ×</span>
                  <ItemIcon item={item as ItemId} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </DrawerPanel>
  );
}
